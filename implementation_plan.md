# Implementation Plan - Multi-Attempt Assignment Workflow

## Goal
Implement a configurable multi-attempt assignment workflow where instructors can configure `max_attempts` (e.g. 1, 2, 3, etc.) per assignment. When a student fails an assignment (`score < passing_score`), if attempts remain (`attemptsUsed < maxAttempts`), they can resubmit. Each attempt creates a separate, non-overwritten submission record with its own attempt number, file, score, feedback, and submission date. Quiz unlock and course certificate eligibility require all required assignments to be successfully passed.

---

## User Review Required

> [!IMPORTANT]
> - **Database Schema Enhancement:** The table `public.assignments` will support configurable `max_attempts` (INTEGER DEFAULT 3, CHECK >= 1).
> - **Multi-Attempt Storage in `assignment_submissions`:** The unique constraint `(assignment_id, student_id)` will be updated to `(assignment_id, student_id, attempt_number)` so Attempt 1, Attempt 2, and Attempt 3 are stored as distinct records, preserving the full submission and grading history.
> - **Resubmission Flow:** When an attempt is failed (`score < passing_score`), the student modal displays the failure status, marks obtained, instructor feedback, attempt counter (`Attempts: X / Max`), and an active "Resubmit Assignment" button.
> - **Quiz Gating:** The quiz remains locked until all mandatory assignments have at least one passed attempt (`score >= passing_score`).
> - **Certificate Gating:** Certificate eligibility requires all required lessons 100% completed, all mandatory assignments passed, and the mandatory quiz passed.

---

## Proposed Changes

### Database Layer
#### [NEW] [011_add_multi_attempt_assignment_support.sql](file:///c:/Users/user/OneDrive/Pictures/lms/lms/backend/supabase/migrations/011_add_multi_attempt_assignment_support.sql)
- Add `max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1)` to `public.assignments`.
- Add `attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number >= 1)` to `public.assignment_submissions`.
- Drop legacy single-attempt constraint `unique_student_assignment` (`assignment_id, student_id`).
- Add composite unique constraint `unique_assignment_student_attempt` on `(assignment_id, student_id, attempt_number)`.

---

### Backend Layer

#### [MODIFY] [assignment.validator.ts](file:///c:/Users/user/OneDrive/Pictures/lms/lms/backend/src/validators/assignment.validator.ts)
- Add `maxAttempts: z.number().int().min(1).optional().default(3)` to `createAssignmentSchema` and `updateAssignmentSchema`.

#### [MODIFY] [types/index.ts](file:///c:/Users/user/OneDrive/Pictures/lms/lms/backend/src/types/index.ts)
- Add `maxAttempts: number` to `Assignment`, `CreateAssignmentDto`, `UpdateAssignmentDto`.
- Add `attemptNumber: number` to `AssignmentSubmission`.

#### [MODIFY] [assignment.service.ts](file:///c:/Users/user/OneDrive/Pictures/lms/lms/backend/src/services/assignment.service.ts)
- **`submitStudentAssignment`:**
  - Query all existing attempts for this student on the assignment (`SELECT attempt_number, status, score FROM assignment_submissions WHERE assignment_id = ... AND student_id = ... ORDER BY attempt_number DESC`).
  - Calculate `nextAttemptNumber = (highestExistingAttempt || 0) + 1`.
  - Enforce constraints:
    - If any attempt is awaiting grading (`status != 'Graded' && score === null`), throw HTTP 400: *"Cannot submit a new attempt while your previous attempt is awaiting instructor grading."*
    - If the latest attempt is already passed (`score >= passing_score`), throw HTTP 400: *"Assignment already passed. Resubmission is not required."*
    - If `nextAttemptNumber > assignment.max_attempts`, throw HTTP 400: *"Maximum submission attempts reached."*
  - Insert new row with `attempt_number: nextAttemptNumber`, `status: 'Submitted'`, `submitted_at: NOW()`, `score: null`, `feedback: null`.
- **`getStudentEnrolledAssignments`:**
  - Return all attempts under `submissionHistory` (Attempt #1, Attempt #2, Attempt #3 with respective files, scores, feedback).
  - Compute `attemptsUsed`, `maxAttempts`, latest status (`'pending' | 'submitted' | 'graded'`), latest score, and pass/fail state.
- **`getInstructorPendingSubmissions` & `getAssignmentSubmissions`:**
  - Include `attempt_number` in mapped response so instructor clearly sees which attempt is being graded.

#### [MODIFY] [progress.service.ts](file:///c:/Users/user/OneDrive/Pictures/lms/lms/backend/src/services/progress.service.ts)
- Check that for each mandatory assignment, the student has at least one passed submission attempt (`score >= passing_score`). Failed attempts do not grant completion.

---

### Frontend Layer

#### [MODIFY] [assignmentService.ts](file:///c:/Users/user/OneDrive/Pictures/lms/lms/edusphere-lms/src/services/assignmentService.ts)
- Include `maxAttempts` in `BackendAssignment` and `attemptNumber` in `BackendSubmission`.

#### [MODIFY] [InstructorAssignmentManagement.tsx](file:///c:/Users/user/OneDrive/Pictures/lms/lms/edusphere-lms/src/pages/instructor/InstructorAssignmentManagement.tsx)
- Pass `maxAttempts: Number(assignmentForm.maxSubmissionAttempts) || 3` during assignment creation and editing.
- In grading modal and pending reviews table, display `Attempt #{sub.attemptNumber}`.

#### [MODIFY] [AssignmentDetailsModal.tsx](file:///c:/Users/user/OneDrive/Pictures/lms/lms/edusphere-lms/src/components/assignments/AssignmentDetailsModal.tsx)
- Render:
  - **Waiting for Grading:** Show *"Waiting for Instructor Grading"* notice, disable resubmission.
  - **Passed:** Show *"Assignment Passed"* with score & feedback, disable resubmission.
  - **Failed with attempts remaining:** Show *"Assignment Failed"*, marks obtained, instructor feedback, *"Attempts: X / Max"*, and render active **"Resubmit Assignment"** button to upload a new attempt.
  - **Failed with maximum attempts reached:** Show *"Maximum attempts reached"*, disable resubmission.
  - **Submission History Tab:** Render all attempts sequentially (`Attempt #1`, `Attempt #2`, `Attempt #3`) with their individual submission dates, files, scores, and instructor feedback.

#### [MODIFY] [AssignmentCard.tsx](file:///c:/Users/user/OneDrive/Pictures/lms/lms/edusphere-lms/src/components/assignments/AssignmentCard.tsx)
- Display `Attempts: {attemptsUsed} / {maxAttempts}` and accurate badge (`Pending`, `Submitted (Under Review)`, `Passed`, `Failed - Resubmit Available`, `Failed - Max Attempts Reached`).

---

## Verification Plan

### Automated Verification
- Run database migration and test script verifying:
  1. Instructor creates assignment with `max_attempts = 3`.
  2. Student submits Attempt 1 → DB record created with `attempt_number = 1`.
  3. Instructor grades Attempt 1 with failing score (`40/100`, passing `60`).
  4. Student submits Attempt 2 → DB record created with `attempt_number = 2` (Attempt 1 preserved).
  5. Instructor grades Attempt 2 with failing score (`50/100`).
  6. Student submits Attempt 3 → DB record created with `attempt_number = 3` (Attempts 1 and 2 preserved).
  7. Instructor grades Attempt 3 with passing score (`85/100`).
  8. Verify `progressService` unlocks quiz access and marks assignment requirement as complete.
  9. Verify Attempt 4 submission is rejected by backend with *"Maximum submission attempts reached"*.

### TypeScript & Build Checks
- `backend`: `npx tsc --noEmit`
- `edusphere-lms`: `npx vite build`

import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireInstructor } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { resourceUploadMiddleware } from '../middleware/upload.middleware';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  reorderAssignmentsSchema,
  createSubmissionSchema,
  gradeSubmissionSchema,
  createAssignmentReattemptRequestSchema,
  reviewAssignmentReattemptRequestSchema,
} from '../validators/assignment.validator';

const router = Router();

// =============================================================
// Instructor Assignment Routes
// =============================================================

// List all assignments across all courses owned by the instructor
router.get(
  '/instructor/assignments',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getAllInstructorAssignments(req, res, next)
);

// List assignments for a course
router.get(
  '/instructor/courses/:courseId/assignments',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getInstructorCourseAssignments(req, res, next)
);

// Create assignment for a course
router.post(
  '/instructor/courses/:courseId/assignments',
  authenticateUser,
  requireInstructor,
  validateRequest(createAssignmentSchema),
  (req, res, next) => assignmentController.createAssignment(req, res, next)
);

// Reorder assignments in a course
router.patch(
  '/instructor/courses/:courseId/assignments/reorder',
  authenticateUser,
  requireInstructor,
  validateRequest(reorderAssignmentsSchema),
  (req, res, next) => assignmentController.reorderAssignments(req, res, next)
);

// Get assignment by ID (Instructor)
router.get(
  '/instructor/assignments/:assignmentId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getAssignmentById(req, res, next)
);

// Update assignment
router.patch(
  '/instructor/assignments/:assignmentId',
  authenticateUser,
  requireInstructor,
  validateRequest(updateAssignmentSchema),
  (req, res, next) => assignmentController.updateAssignment(req, res, next)
);

// Delete assignment
router.delete(
  '/instructor/assignments/:assignmentId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.deleteAssignment(req, res, next)
);

// Get assignment submissions
router.get(
  '/instructor/assignments/:assignmentId/submissions',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getAssignmentSubmissions(req, res, next)
);

// Get all pending submissions across instructor courses
router.get(
  '/instructor/submissions/pending',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getInstructorPendingSubmissions(req, res, next)
);

// Get signed file URL for inline PDF preview
router.get(
  '/instructor/submissions/:submissionId/file-url',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getSubmissionFileUrl(req, res, next)
);

// Get single submission details (Instructor)
router.get(
  '/instructor/submissions/:submissionId',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getSubmissionByIdForInstructor(req, res, next)
);

// Grade submission
router.patch(
  '/instructor/submissions/:submissionId/grade',
  authenticateUser,
  requireInstructor,
  validateRequest(gradeSubmissionSchema),
  (req, res, next) => assignmentController.gradeSubmission(req, res, next)
);

// Get instructor assignment reattempt requests
router.get(
  '/instructor/assignment-reattempt-requests',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.getInstructorReattemptRequests(req, res, next)
);

// Approve assignment reattempt request
router.post(
  '/instructor/assignment-reattempt-requests/:requestId/approve',
  authenticateUser,
  requireInstructor,
  (req, res, next) => assignmentController.approveReattemptRequest(req, res, next)
);

// Reject assignment reattempt request
router.post(
  '/instructor/assignment-reattempt-requests/:requestId/reject',
  authenticateUser,
  requireInstructor,
  validateRequest(reviewAssignmentReattemptRequestSchema),
  (req, res, next) => assignmentController.rejectReattemptRequest(req, res, next)
);

// =============================================================
// Public & Student Assignment Routes
// =============================================================

// Get assignments for a published course
router.get(
  '/courses/:courseId/assignments',
  (req, res, next) => assignmentController.getPublicCourseAssignments(req, res, next)
);

// Get assignment details by ID
router.get(
  '/assignments/:assignmentId',
  (req, res, next) => assignmentController.getAssignmentById(req, res, next)
);

// Get student enrolled assignments with submissions
router.get(
  '/student/assignments',
  authenticateUser,
  (req, res, next) => assignmentController.getStudentEnrolledAssignments(req, res, next)
);

// Upload student assignment submission file
router.post(
  '/assignments/:assignmentId/upload',
  authenticateUser,
  resourceUploadMiddleware.single('file'),
  (req, res, next) => assignmentController.uploadStudentSubmissionFile(req, res, next)
);

// Submit student assignment
router.post(
  '/assignments/:assignmentId/submissions',
  authenticateUser,
  validateRequest(createSubmissionSchema),
  (req, res, next) => assignmentController.submitStudentAssignment(req, res, next)
);

// Student create assignment reattempt request
router.post(
  '/assignments/:assignmentId/reattempt-requests',
  authenticateUser,
  validateRequest(createAssignmentReattemptRequestSchema),
  (req, res, next) => assignmentController.createReattemptRequest(req, res, next)
);

// Student get own assignment reattempt requests
router.get(
  '/student/assignments/reattempt-requests',
  authenticateUser,
  (req, res, next) => assignmentController.getStudentReattemptRequests(req, res, next)
);

// Get signed file URL for student's own submission (authenticated, student-only)
router.get(
  '/student/submissions/:submissionId/file-url',
  authenticateUser,
  (req, res, next) => assignmentController.getStudentSubmissionFileUrl(req, res, next)
);

// Get student submission
router.get(
  '/student/submissions/:submissionId',
  authenticateUser,
  (req, res, next) => assignmentController.getStudentSubmission(req, res, next)
);

export default router;


/**
 * End-to-End Test for Assignment Reattempt Request Workflow
 * Run: npx tsx scripts/test-assignment-reattempt-workflow.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { assignmentService } from '../src/services/assignment.service';
import { supabaseAdmin } from '../src/config/supabase';

async function testAssignmentReattemptWorkflow() {
  console.log('=== STARTING ASSIGNMENT REATTEMPT WORKFLOW INTEGRATION TEST ===\n');
  const timestamp = Date.now();

  // 1. Fetch real student & instructor profiles
  const { data: students } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .limit(1);

  const { data: instructors } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'instructor')
    .limit(1);

  const student = students?.[0];
  const instructor = instructors?.[0];

  if (!student || !instructor) {
    throw new Error('Missing required student or instructor in profiles table');
  }

  const studentId = student.id;
  const instructorId = instructor.id;

  console.log(`Student: ${student.full_name} (${studentId})`);
  console.log(`Instructor: ${instructor.full_name} (${instructorId})\n`);

  // 2. Create Course
  const courseId = crypto.randomUUID();
  const { data: course, error: cErr } = await supabaseAdmin
    .from('courses')
    .insert({
      id: courseId,
      instructor_id: instructorId,
      title: `Assignment Reattempt Test Course ${timestamp}`,
      slug: `assignment-reattempt-course-${timestamp}`,
      short_description: 'Testing reattempt workflow',
      full_description: 'Full description',
      price: 0,
      course_status: 'Published',
      approval_status: 'Approved',
    })
    .select()
    .single();

  if (cErr || !course) {
    throw new Error(`Failed to create test course: ${cErr?.message}`);
  }

  // 3. Enroll student
  const { error: eErr } = await supabaseAdmin.from('enrollments').insert({
    student_id: studentId,
    course_id: courseId,
    status: 'Active',
  });
  if (eErr) throw new Error(`Failed to enroll student: ${eErr.message}`);

  // 4. Create Assignment with max_attempts = 3, passing_score = 60
  const assignmentId = crypto.randomUUID();
  const { data: assignment, error: aErr } = await supabaseAdmin
    .from('assignments')
    .insert({
      id: assignmentId,
      course_id: courseId,
      title: `Assignment with Attempt Limits ${timestamp}`,
      description: 'Test assignment description',
      instructions: 'Follow instructions',
      max_score: 100,
      passing_score: 60,
      max_attempts: 3,
      status: 'Published',
      position: 1,
    })
    .select()
    .single();

  if (aErr || !assignment) throw new Error(`Failed to create assignment: ${aErr?.message}`);

  console.log('1. Course & Assignment initialized: maxAttempts = 3, passingScore = 60');

  // 5. Submit & Grade Attempts 1, 2, and 3 (all failing scores)
  for (let i = 1; i <= 3; i++) {
    const sub = await assignmentService.submitStudentAssignment(studentId, assignmentId, {
      submissionText: `Solution for Attempt #${i}`,
    });
    console.log(`- Student submitted Attempt #${sub.attemptNumber}`);

    await assignmentService.gradeSubmission(instructorId, sub.id, {
      score: 30 + i * 5, // 35, 40, 45 (all < 60)
      feedback: `Attempt #${i} failed to meet passing score (60).`,
      status: 'Graded',
    });
    console.log(`- Instructor graded Attempt #${i}: Score = ${30 + i * 5}/100 (Failed)`);
  }

  // 6. Verify Attempt #4 is blocked because max attempts (3) is reached
  let blockedError = false;
  try {
    await assignmentService.submitStudentAssignment(studentId, assignmentId, {
      submissionText: 'Attempt #4 without permission',
    });
  } catch (err: any) {
    blockedError = true;
    console.log(`2. Verified: Attempt #4 correctly blocked with error: "${err.message}"`);
  }
  if (!blockedError) {
    throw new Error('FAILED: Attempt #4 should have been blocked before requesting extra attempt!');
  }

  // 7. Student submits an assignment reattempt request
  const requestReason = 'I have reviewed the feedback and solved the remaining exercises. Please grant one more attempt.';
  const reattemptReq = await assignmentService.createReattemptRequest(studentId, assignmentId, requestReason);
  console.log(`3. Student submitted reattempt request: ID = ${reattemptReq.id}, Status = ${reattemptReq.status}`);

  // 8. Verify duplicate pending request is blocked
  let duplicateBlocked = false;
  try {
    await assignmentService.createReattemptRequest(studentId, assignmentId, 'Duplicate request');
  } catch (err: any) {
    duplicateBlocked = true;
    console.log(`4. Verified: Duplicate pending request rejected: "${err.message}"`);
  }
  if (!duplicateBlocked) {
    throw new Error('FAILED: Duplicate pending request should be blocked!');
  }

  // 9. Instructor views pending reattempt requests
  const instructorRequests = await assignmentService.getInstructorReattemptRequests(instructorId, courseId);
  const foundReq = instructorRequests.find((r) => r.id === reattemptReq.id);
  console.log(`5. Instructor retrieved requests: Found request with student = "${foundReq?.studentName}", status = "${foundReq?.status}"`);
  if (!foundReq || foundReq.status !== 'pending') {
    throw new Error('FAILED: Instructor could not find pending reattempt request!');
  }

  // 10. Instructor approves reattempt request
  await assignmentService.approveReattemptRequest(instructorId, reattemptReq.id);
  console.log('6. Instructor approved the reattempt request (+1 attempt granted)');

  // 11. Student checks enrolled assignments
  const studentAssignments = await assignmentService.getStudentEnrolledAssignments(studentId, courseId);
  const targetAsg = studentAssignments.find((a) => a.id === assignmentId);
  console.log(`7. Student enrolled assignment status: effectiveMaxAttempts = ${targetAsg?.maxAttempts}, canResubmit = ${targetAsg?.canResubmit}, attemptRequestStatus = ${targetAsg?.attemptRequestStatus}`);

  if (targetAsg?.maxAttempts !== 4 || !targetAsg?.canResubmit) {
    throw new Error(`FAILED: Expected effectiveMaxAttempts = 4 and canResubmit = true. Got maxAttempts = ${targetAsg?.maxAttempts}, canResubmit = ${targetAsg?.canResubmit}`);
  }

  // 12. Student successfully submits Attempt #4
  const attempt4Sub = await assignmentService.submitStudentAssignment(studentId, assignmentId, {
    submissionText: 'Attempt #4 complete comprehensive solution.',
  });
  console.log(`8. Student successfully submitted Attempt #${attempt4Sub.attemptNumber}! Status = ${attempt4Sub.status}`);
  if (attempt4Sub.attemptNumber !== 4) {
    throw new Error(`FAILED: Expected attemptNumber 4, got ${attempt4Sub.attemptNumber}`);
  }

  // 13. Instructor grades Attempt #4 with passing marks (85/100)
  const gradedAttempt4 = await assignmentService.gradeSubmission(instructorId, attempt4Sub.id, {
    score: 85,
    feedback: 'Excellent work on attempt 4! Passed.',
    status: 'Graded',
  });
  console.log(`9. Instructor graded Attempt #4: Score = ${gradedAttempt4.score}/100 -> PASSED!`);

  // 14. Verify final student assignment status is passed
  const finalAssignments = await assignmentService.getStudentEnrolledAssignments(studentId, courseId);
  const finalAsg = finalAssignments.find((a) => a.id === assignmentId);
  console.log(`10. Final Assignment State: assignmentPassed = ${finalAsg?.assignmentPassed}, grade = ${finalAsg?.grade}, canResubmit = ${finalAsg?.canResubmit}`);

  if (!finalAsg?.assignmentPassed || finalAsg?.grade !== 85) {
    throw new Error('FAILED: Final assignment should be marked as passed with grade 85');
  }

  console.log('\n=== ALL ASSIGNMENT REATTEMPT WORKFLOW TESTS PASSED SUCCESSFULLY (100%) ===\n');
}

testAssignmentReattemptWorkflow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Integration test failed:', err);
    process.exit(1);
  });

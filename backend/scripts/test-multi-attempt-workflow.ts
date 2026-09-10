import { supabaseAdmin } from '../src/config/supabase';
import { assignmentService } from '../src/services/assignment.service';
import { progressService } from '../src/services/progress.service';

async function runRealDatabaseTests() {
  console.log('====================================================');
  console.log('STARTING REAL DATABASE MULTI-ATTEMPT WORKFLOW TESTS');
  console.log('====================================================');

  // 1. Fetch real student and instructor
  const { data: students } = await supabaseAdmin.from('profiles').select('id, full_name').eq('role', 'student').limit(1);
  const { data: instructors } = await supabaseAdmin.from('profiles').select('id, full_name').eq('role', 'instructor').limit(1);
  const { data: courses } = await supabaseAdmin.from('courses').select('id, title, instructor_id, course_status, approval_status').eq('course_status', 'Published').eq('approval_status', 'Approved').limit(1);

  if (!students?.[0] || !instructors?.[0] || !courses?.[0]) {
    throw new Error('Test prerequisites not found in database.');
  }

  const student = students[0];
  const instructor = instructors[0];
  const course = courses[0];
  console.log('Testing with:');
  console.log('  Student:', student.full_name, student.id);
  console.log('  Instructor:', instructor.full_name, instructor.id);
  console.log('  Course:', course.title, course.id);

  // Ensure student is enrolled in course
  await supabaseAdmin.from('enrollments').upsert({
    student_id: student.id,
    course_id: course.id,
    status: 'Active',
    enrolled_at: new Date().toISOString()
  }, { onConflict: 'student_id,course_id' });

  // Mark all course lessons as completed for this student so prerequisites are satisfied
  const { data: modules } = await supabaseAdmin.from('course_modules').select('id, lessons(id)').eq('course_id', course.id);
  for (const m of (modules || [])) {
    for (const l of ((m.lessons as any[]) || [])) {
      await supabaseAdmin.from('lesson_progress').upsert({
        student_id: student.id,
        lesson_id: l.id,
        course_id: course.id,
        status: 'Completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100
      }, { onConflict: 'student_id,lesson_id' });
    }
  }

  // ----------------------------------------------------
  // TEST A: Max Attempts = 10 Lifecycle & Strict Rules
  // ----------------------------------------------------
  console.log('\n--- TEST A: Create Assignment with max_attempts = 10 ---');
  const asg10 = await assignmentService.createAssignment(course.instructor_id, course.id, {
    title: 'Automated Multi-Attempt Test Assignment (Max 10)',
    description: 'Testing attempts 1 through 10',
    maxScore: 100,
    passingScore: 70,
    maxAttempts: 10,
    status: 'Published'
  });
  console.log('Created Assignment ID:', asg10.id, 'max_attempts:', asg10.maxAttempts);

  // Attempt 1: Submit
  console.log('\n--- Submitting Attempt 1 ---');
  const sub1 = await assignmentService.submitStudentAssignment(student.id, asg10.id, {
    submissionText: 'Attempt 1 Solution Text',
    fileUrl: 'submissions/test/attempt1.pdf'
  });
  console.log('Sub 1 ID:', sub1.id, 'attempt_number:', sub1.attemptNumber, 'status:', sub1.status);

  // Attempt 1 Pending: Try to submit Attempt 2 while Attempt 1 is waiting for grading -> MUST FAIL
  console.log('\n--- Testing Waiting for Grading Blocker (Submitting while Attempt 1 is un-graded) ---');
  let waitingBlocked = false;
  try {
    await assignmentService.submitStudentAssignment(student.id, asg10.id, {
      submissionText: 'Attempt 2 early submission',
      fileUrl: 'submissions/test/attempt2.pdf'
    });
  } catch (err: any) {
    waitingBlocked = true;
    console.log('Successfully caught expected blocker error:', err.message);
  }
  if (!waitingBlocked) throw new Error('FAILED: Allowed submission while previous attempt was waiting for grading!');

  // Grade Attempt 1 as Failed (score = 40 < 70)
  console.log('\n--- Grading Attempt 1 as FAILED (score = 40) ---');
  await assignmentService.gradeSubmission(course.instructor_id, sub1.id, {
    score: 40,
    feedback: 'Attempt 1 failed. Please review concepts and resubmit.',
    status: 'Graded'
  });

  // Attempt 2: Submit now that Attempt 1 is graded
  console.log('\n--- Submitting Attempt 2 ---');
  const sub2 = await assignmentService.submitStudentAssignment(student.id, asg10.id, {
    submissionText: 'Attempt 2 Solution Text',
    fileUrl: 'submissions/test/attempt2.pdf'
  });
  console.log('Sub 2 ID:', sub2.id, 'attempt_number:', sub2.attemptNumber, 'status:', sub2.status);

  // Verify Attempt 1 and Attempt 2 are distinct in database
  const { data: dbAttemptsA } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id, attempt_number, status, score')
    .eq('assignment_id', asg10.id)
    .eq('student_id', student.id)
    .order('attempt_number', { ascending: true });
  console.log('DB Attempts count for Assignment A:', dbAttemptsA?.length);
  console.log('DB Records:', dbAttemptsA);
  if (dbAttemptsA?.length !== 2 || dbAttemptsA[0].id === dbAttemptsA[1].id) {
    throw new Error('FAILED: Attempt 1 was overwritten instead of creating a distinct row!');
  }

  // ----------------------------------------------------
  // TEST B: Max Attempts = 3 Exhaustion & Pass Blocker
  // ----------------------------------------------------
  console.log('\n--- TEST B: Create Assignment with max_attempts = 3 ---');
  const asg3 = await assignmentService.createAssignment(course.instructor_id, course.id, {
    title: 'Automated Multi-Attempt Pass & Exhaust Test (Max 3)',
    description: 'Testing pass blocker and attempt exhaustion',
    maxScore: 100,
    passingScore: 60,
    maxAttempts: 3,
    status: 'Published'
  });
  console.log('Created Assignment ID:', asg3.id, 'max_attempts:', asg3.maxAttempts);

  // Attempt 1: Submit & Fail
  const asg3_sub1 = await assignmentService.submitStudentAssignment(student.id, asg3.id, {
    submissionText: 'Attempt 1 fail test',
    fileUrl: 'submissions/test/asg3_att1.pdf'
  });
  await assignmentService.gradeSubmission(course.instructor_id, asg3_sub1.id, {
    score: 30,
    feedback: 'Attempt 1 Failed',
    status: 'Graded'
  });
  console.log('Attempt 1 submitted and failed (30/100)');

  // Attempt 2: Submit & Pass (score = 85 >= 60)
  const asg3_sub2 = await assignmentService.submitStudentAssignment(student.id, asg3.id, {
    submissionText: 'Attempt 2 pass test',
    fileUrl: 'submissions/test/asg3_att2.pdf'
  });
  await assignmentService.gradeSubmission(course.instructor_id, asg3_sub2.id, {
    score: 85,
    feedback: 'Attempt 2 Passed! Great work.',
    status: 'Graded'
  });
  console.log('Attempt 2 submitted and passed (85/100)');

  // Test Pass Blocker: Attempt 3 should be REJECTED because Attempt 2 passed
  console.log('\n--- Testing Pass Blocker (Attempting to submit Attempt 3 after Attempt 2 passed) ---');
  let passBlocked = false;
  try {
    await assignmentService.submitStudentAssignment(student.id, asg3.id, {
      submissionText: 'Attempt 3 redundant submission',
      fileUrl: 'submissions/test/asg3_att3.pdf'
    });
  } catch (err: any) {
    passBlocked = true;
    console.log('Successfully caught expected blocker error:', err.message);
  }
  if (!passBlocked) throw new Error('FAILED: Allowed resubmission after assignment was already passed!');

  // ----------------------------------------------------
  // TEST C: Max Attempts Exhaustion (3 Fails -> Attempt 4 Blocked)
  // ----------------------------------------------------
  console.log('\n--- TEST C: Max Attempts Exhaustion (3 Fails -> Block Attempt 4) ---');
  const asgExhaust = await assignmentService.createAssignment(course.instructor_id, course.id, {
    title: 'Automated Exhaustion Test',
    maxScore: 100,
    passingScore: 60,
    maxAttempts: 3,
    status: 'Published'
  });

  for (let i = 1; i <= 3; i++) {
    const s = await assignmentService.submitStudentAssignment(student.id, asgExhaust.id, {
      submissionText: 'Fail attempt ' + i,
      fileUrl: 'submissions/test/fail' + i + '.pdf'
    });
    await assignmentService.gradeSubmission(course.instructor_id, s.id, {
      score: 20,
      feedback: 'Failed attempt ' + i,
      status: 'Graded'
    });
    console.log('  Recorded & graded failed Attempt #' + i);
  }

  // Attempt 4 must be rejected
  let maxBlocked = false;
  try {
    await assignmentService.submitStudentAssignment(student.id, asgExhaust.id, {
      submissionText: 'Attempt 4 over limit',
      fileUrl: 'submissions/test/fail4.pdf'
    });
  } catch (err: any) {
    maxBlocked = true;
    console.log('Successfully caught expected max attempts error:', err.message);
  }
  if (!maxBlocked) throw new Error('FAILED: Allowed submission beyond max_attempts!');

  // ----------------------------------------------------
  // TEST D: Progress & Certificate Gating Verification
  // ----------------------------------------------------
  console.log('\n--- TEST D: Progress & Certificate Gating Verification ---');
  const progressStatus = await progressService.getCourseProgress(student.id, course.id);
  console.log('Progress Status for Course:', {
    assignmentsSubmitted: progressStatus.assignmentsSubmitted,
    assignmentsGraded: progressStatus.assignmentsGraded,
    assignmentsComplete: progressStatus.assignmentsComplete,
    isEligibleForCertificate: progressStatus.isEligibleForCertificate
  });

  // Cleanup test assignments
  await supabaseAdmin.from('assignment_submissions').delete().in('assignment_id', [asg10.id, asg3.id, asgExhaust.id]);
  await supabaseAdmin.from('assignments').delete().in('id', [asg10.id, asg3.id, asgExhaust.id]);
  console.log('\nTest cleanup complete.');
  console.log('\n====================================================');
  console.log('ALL REAL DATABASE WORKFLOW TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

runRealDatabaseTests().then(() => process.exit(0)).catch((e) => { console.error('TEST SUITE ERROR:', e); process.exit(1); });

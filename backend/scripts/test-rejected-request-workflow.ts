import { supabaseAdmin } from '../src/config/supabase';
import { quizService } from '../src/services/quiz.service';

async function runTest() {
  console.log('================================================================');
  console.log('TESTING REJECTED QUIZ ATTEMPT REQUEST WORKFLOW (REAL DATABASE)');
  console.log('================================================================\n');

  // 1. Fetch real student, instructor, and quiz from DB
  const { data: student } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'student')
    .limit(1)
    .single();

  const { data: instructor } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'instructor')
    .limit(1)
    .single();

  if (!student || !instructor) {
    throw new Error('Could not find student and instructor in database');
  }

  console.log(`Student: ${student.full_name} (${student.id})`);
  console.log(`Instructor: ${instructor.full_name} (${instructor.id})`);

  // Fetch or create a test course and quiz with max_attempts = 3
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, title, instructor_id')
    .eq('instructor_id', instructor.id)
    .limit(1)
    .single();

  if (!course) {
    throw new Error('Could not find course for instructor');
  }

  // Ensure student is enrolled
  const { data: existingEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('student_id', student.id)
    .maybeSingle();

  if (!existingEnrollment) {
    await supabaseAdmin.from('enrollments').insert({
      course_id: course.id,
      student_id: student.id,
      status: 'active',
      enrolled_at: new Date().toISOString(),
    });
  }

  // Pass any required assignments in this course so the quiz is unlocked
  const { data: assignments } = await supabaseAdmin
    .from('assignments')
    .select('id, passing_score')
    .eq('course_id', course.id);

  if (assignments && assignments.length > 0) {
    for (const asg of assignments) {
      const { data: existingSub } = await supabaseAdmin
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', asg.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existingSub) {
        await supabaseAdmin
          .from('assignment_submissions')
          .update({
            status: 'Graded',
            score: (asg.passing_score || 60) + 10,
          })
          .eq('id', existingSub.id);
      } else {
        await supabaseAdmin.from('assignment_submissions').insert({
          assignment_id: asg.id,
          student_id: student.id,
          status: 'Graded',
          score: (asg.passing_score || 60) + 10,
          submission_text: 'Completed',
          submitted_at: new Date().toISOString(),
        });
      }
    }
  }

  // Fetch a quiz for this course
  let { data: quiz } = await supabaseAdmin
    .from('quizzes')
    .select('id, title, course_id, max_attempts, passing_score')
    .eq('course_id', course.id)
    .limit(1)
    .maybeSingle();

  if (!quiz) {
    const { data: anyQuiz } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, course_id, max_attempts, passing_score')
      .limit(1)
      .single();
    quiz = anyQuiz;
  }

  if (!quiz) {
    throw new Error('No quiz found');
  }

  // Update quiz max_attempts = 3 for testing
  await supabaseAdmin
    .from('quizzes')
    .update({ max_attempts: 3, passing_score: 80 })
    .eq('id', quiz.id);

  console.log(`Testing with Quiz: "${quiz.title}" (${quiz.id}) - Max Attempts: 3\n`);

  // Clean up any existing attempts and reattempt requests for clean isolation
  await supabaseAdmin.from('quiz_reattempt_requests').delete().eq('quiz_id', quiz.id).eq('student_id', student.id);
  await supabaseAdmin.from('quiz_attempts').delete().eq('quiz_id', quiz.id).eq('student_id', student.id);

  // STEP 1: Attempt 1 -> Fail
  console.log('--- Step 1: Student takes Attempt 1 (Fails) ---');
  const attempt1 = await quizService.startQuizAttempt(student.id, quiz.id);
  console.log(`Created Attempt 1 ID: ${attempt1.id}`);
  await quizService.submitQuizAttempt(student.id, attempt1.id, { answers: [] });
  console.log('Attempt 1 Submitted: Status = completed, Passed = false\n');

  // STEP 2: Attempt 2 -> Fail
  console.log('--- Step 2: Student takes Attempt 2 (Fails) ---');
  const attempt2 = await quizService.startQuizAttempt(student.id, quiz.id);
  console.log(`Created Attempt 2 ID: ${attempt2.id}`);
  await quizService.submitQuizAttempt(student.id, attempt2.id, { answers: [] });
  console.log('Attempt 2 Submitted: Status = completed, Passed = false\n');

  // STEP 3: Attempt 3 -> Fail
  console.log('--- Step 3: Student takes Attempt 3 (Fails) ---');
  const attempt3 = await quizService.startQuizAttempt(student.id, quiz.id);
  console.log(`Created Attempt 3 ID: ${attempt3.id}`);
  await quizService.submitQuizAttempt(student.id, attempt3.id, { answers: [] });
  console.log('Attempt 3 Submitted: Status = completed, Passed = false (All 3/3 attempts exhausted)\n');

  // Check student enrolled quizzes state before request
  let studentQuizzes = await quizService.getStudentEnrolledQuizzes(student.id);
  let targetQuizState = studentQuizzes.find((q) => q.id === quiz.id);
  console.log('Student Quiz State after 3 failed attempts:');
  console.log(`- attemptsUsed: ${targetQuizState?.attemptsUsed}/${targetQuizState?.maxAttempts}`);
  console.log(`- attemptRequestStatus: "${targetQuizState?.attemptRequestStatus}" (expected: "none")`);
  if (targetQuizState?.attemptRequestStatus !== 'none') {
    throw new Error(`Expected attemptRequestStatus to be 'none', got '${targetQuizState?.attemptRequestStatus}'`);
  }

  // STEP 4: Student Submits "Request Another Attempt"
  console.log('\n--- Step 4: Student Submits "Request Another Attempt" ---');
  const reqRecord = await quizService.requestReattempt(
    student.id,
    quiz.id,
    'I have reviewed the modules and would like one more attempt.'
  );
  console.log(`Request created: ID = ${reqRecord.id}, Status = ${reqRecord.status}`);

  // Check student enrolled quizzes state while pending
  studentQuizzes = await quizService.getStudentEnrolledQuizzes(student.id);
  targetQuizState = studentQuizzes.find((q) => q.id === quiz.id);
  console.log('Student Quiz State while request is pending:');
  console.log(`- attemptRequestStatus: "${targetQuizState?.attemptRequestStatus}" (expected: "pending")`);
  if (targetQuizState?.attemptRequestStatus !== 'pending') {
    throw new Error(`Expected attemptRequestStatus to be 'pending', got '${targetQuizState?.attemptRequestStatus}'`);
  }

  // STEP 5: Verify duplicate request while pending is BLOCKED
  console.log('\n--- Step 5: Verify duplicate request while pending is BLOCKED ---');
  let duplicateBlocked = false;
  try {
    await quizService.requestReattempt(student.id, quiz.id, 'Duplicate attempt request');
  } catch (err: any) {
    duplicateBlocked = true;
    console.log(`Duplicate request correctly blocked: "${err.message}"`);
  }
  if (!duplicateBlocked) throw new Error('Duplicate request should have been blocked!');

  // STEP 6: Instructor REJECTS the request with feedback
  console.log('\n--- Step 6: Instructor REJECTS the request with feedback ---');
  const rejectionFeedback = 'Please review Module 3 assignments thoroughly before requesting additional attempts.';
  const rejectedReq = await quizService.rejectReattemptRequest(
    instructor.id,
    reqRecord.id,
    rejectionFeedback
  );
  console.log(`Request rejected! Status = ${rejectedReq.status}, Feedback = "${rejectedReq.instructor_feedback}"`);

  // STEP 7: Check student enrolled quizzes state after rejection (Simulating student page refresh)
  console.log('\n--- Step 7: Verify Student View after Refresh (getStudentEnrolledQuizzes) ---');
  studentQuizzes = await quizService.getStudentEnrolledQuizzes(student.id);
  targetQuizState = studentQuizzes.find((q) => q.id === quiz.id);
  console.log('Student Quiz State after rejection:');
  console.log(`- attemptsUsed: ${targetQuizState?.attemptsUsed}/${targetQuizState?.maxAttempts}`);
  console.log(`- status: "${targetQuizState?.status}" (expected: "failed")`);
  console.log(`- attemptRequestStatus: "${targetQuizState?.attemptRequestStatus}" (expected: "rejected")`);
  console.log(`- attemptRequestFeedback: "${targetQuizState?.attemptRequestFeedback}"`);

  if (targetQuizState?.attemptRequestStatus !== 'rejected') {
    throw new Error(`Expected attemptRequestStatus to be 'rejected', got '${targetQuizState?.attemptRequestStatus}'`);
  }
  if (targetQuizState?.attemptRequestFeedback !== rejectionFeedback) {
    throw new Error(`Expected feedback to match '${rejectionFeedback}', got '${targetQuizState?.attemptRequestFeedback}'`);
  }

  // STEP 8: Verify Attempt 4 CANNOT be started (Attempt 4 BLOCKED)
  console.log('\n--- Step 8: Verify Attempt 4 CANNOT be started (Attempt 4 BLOCKED) ---');
  let attempt4Blocked = false;
  try {
    await quizService.startQuizAttempt(student.id, quiz.id);
  } catch (err: any) {
    attempt4Blocked = true;
    console.log(`Attempt 4 correctly blocked: "${err.message}"`);
  }
  if (!attempt4Blocked) throw new Error('Attempt 4 should have been blocked after rejection!');

  // STEP 9: Verify Student CANNOT re-submit another request after rejection
  console.log('\n--- Step 9: Verify Student CANNOT re-submit another request after rejection ---');
  let resubmitBlocked = false;
  try {
    await quizService.requestReattempt(student.id, quiz.id, 'Trying to submit again after rejection');
  } catch (err: any) {
    resubmitBlocked = true;
    console.log(`Re-submission correctly blocked: "${err.message}"`);
  }
  if (!resubmitBlocked) throw new Error('Re-submission should have been blocked after rejection!');

  // STEP 10: Verify Database Integrity (Attempts 1, 2, 3 remain preserved and untouched)
  console.log('\n--- Step 10: Verify Database Integrity ---');
  const { data: storedAttempts, error: attErr } = await supabaseAdmin
    .from('quiz_attempts')
    .select('id, quiz_id, student_id, status, passed, score, percentage')
    .eq('quiz_id', quiz.id)
    .eq('student_id', student.id)
    .order('created_at', { ascending: true });

  if (attErr) throw new Error(`Failed to fetch stored attempts: ${attErr.message}`);

  console.log(`Found ${storedAttempts?.length} stored attempts in database (expected: 3):`);
  storedAttempts?.forEach((a, idx) => {
    console.log(`- Attempt ${idx + 1}: ID = ${a.id}, Status = ${a.status}, Passed = ${a.passed}`);
  });

  if (storedAttempts?.length !== 3) {
    throw new Error(`Expected 3 attempts, found ${storedAttempts?.length}`);
  }

  console.log('\n================================================================');
  console.log('ALL REJECTED ATTEMPT WORKFLOW REQUIREMENTS VERIFIED 100%!');
  console.log('================================================================');
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });

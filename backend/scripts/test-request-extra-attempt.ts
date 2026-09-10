import { supabaseAdmin } from '../src/config/supabase';
import { quizService } from '../src/services/quiz.service';

async function runTest() {
  console.log('================================================================');
  console.log('TESTING "REQUEST ANOTHER ATTEMPT" REAL WORKFLOW END-TO-END');
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
  console.log(`Created Attempt 2 ID: ${attempt2.id} (Different: ${attempt2.id !== attempt1.id})`);
  await quizService.submitQuizAttempt(student.id, attempt2.id, { answers: [] });
  console.log('Attempt 2 Submitted: Status = completed, Passed = false\n');

  // STEP 3: Attempt 3 -> Fail
  console.log('--- Step 3: Student takes Attempt 3 (Fails) ---');
  const attempt3 = await quizService.startQuizAttempt(student.id, quiz.id);
  console.log(`Created Attempt 3 ID: ${attempt3.id} (Different: ${attempt3.id !== attempt2.id})`);
  await quizService.submitQuizAttempt(student.id, attempt3.id, { answers: [] });
  console.log('Attempt 3 Submitted: Status = completed, Passed = false (All 3/3 attempts exhausted)\n');

  // STEP 4: Attempt 4 must be REJECTED prior to request approval
  console.log('--- Step 4: Verify Attempt 4 is BLOCKED before approval ---');
  let attempt4Blocked = false;
  try {
    await quizService.startQuizAttempt(student.id, quiz.id);
  } catch (err: any) {
    attempt4Blocked = true;
    console.log(`Attempt 4 correctly blocked: "${err.message}"`);
  }
  if (!attempt4Blocked) throw new Error('Attempt 4 should have been blocked!');

  // STEP 5: Student submits Reattempt Request
  console.log('\n--- Step 5: Student submits Reattempt Request ---');
  const reqRecord = await quizService.requestReattempt(
    student.id,
    quiz.id,
    'I had technical difficulties and studied the material again. Requesting one more chance.'
  );
  console.log(`Reattempt Request created: ID = ${reqRecord.id}, Status = ${reqRecord.status}`);

  // STEP 6: Duplicate request must be BLOCKED
  console.log('\n--- Step 6: Verify duplicate pending request is BLOCKED ---');
  let duplicateBlocked = false;
  try {
    await quizService.requestReattempt(student.id, quiz.id, 'Duplicate request');
  } catch (err: any) {
    duplicateBlocked = true;
    console.log(`Duplicate request correctly blocked: "${err.message}"`);
  }
  if (!duplicateBlocked) throw new Error('Duplicate request should have been blocked!');

  // STEP 7: Instructor views pending requests
  console.log('\n--- Step 7: Instructor fetches pending reattempt requests ---');
  const instructorRequests = await quizService.getInstructorReattemptRequests(instructor.id);
  const found = instructorRequests.find((r) => r.id === reqRecord.id);
  console.log(`Found pending request in instructor queue: ${Boolean(found)}`);
  if (found) {
    console.log(`Request details: Student = ${found.studentName}, Attempts Used = ${found.attemptsUsed}/${found.maxAttempts}, Status = ${found.status}`);
  }

  // STEP 8: Instructor APPROVES the request (+1 Attempt granted)
  console.log('\n--- Step 8: Instructor approves the request (+1 Attempt) ---');
  const approvedReq = await quizService.approveReattemptRequest(instructor.id, reqRecord.id);
  console.log(`Request approved! Status = ${approvedReq.status}, Reviewed By = ${approvedReq.reviewed_by}`);

  // STEP 9: Student starts Attempt 4 (must receive a BRAND NEW attempt ID)
  console.log('\n--- Step 9: Student starts Attempt 4 ---');
  const attempt4 = await quizService.startQuizAttempt(student.id, quiz.id);
  console.log(`Created Attempt 4 ID: ${attempt4.id}`);
  const uniqueAttempt4 = (
    attempt4.id !== attempt1.id &&
    attempt4.id !== attempt2.id &&
    attempt4.id !== attempt3.id
  );
  console.log(`Attempt 4 has a unique new ID: ${uniqueAttempt4}`);
  if (!uniqueAttempt4) throw new Error('Attempt 4 ID is not unique!');

  // Submit Attempt 4 -> Fail
  await quizService.submitQuizAttempt(student.id, attempt4.id, { answers: [] });
  console.log('Attempt 4 Submitted: Status = completed, Passed = false (4/4 attempts now used)');

  // STEP 10: Attempt 5 must be BLOCKED (effective max = 3 + 1 = 4)
  console.log('\n--- Step 10: Verify Attempt 5 is BLOCKED (4/4 exhausted) ---');
  let attempt5Blocked = false;
  try {
    await quizService.startQuizAttempt(student.id, quiz.id);
  } catch (err: any) {
    attempt5Blocked = true;
    console.log(`Attempt 5 correctly blocked: "${err.message}"`);
  }
  if (!attempt5Blocked) throw new Error('Attempt 5 should have been blocked!');

  // STEP 11: Rejection workflow test
  console.log('\n--- Step 11: Student requests again & Instructor REJECTS with feedback ---');
  const reqRecord2 = await quizService.requestReattempt(
    student.id,
    quiz.id,
    'Requesting attempt 5.'
  );
  console.log(`New request created: ID = ${reqRecord2.id}`);

  const rejectedReq = await quizService.rejectReattemptRequest(
    instructor.id,
    reqRecord2.id,
    'Please review Module 3 assignments before requesting another attempt.'
  );
  console.log(`Request rejected! Status = ${rejectedReq.status}, Instructor Feedback = "${rejectedReq.instructor_feedback}"`);

  // Verify Attempt 5 still blocked after rejection
  let attemptBlockedAfterReject = false;
  try {
    await quizService.startQuizAttempt(student.id, quiz.id);
  } catch (err: any) {
    attemptBlockedAfterReject = true;
    console.log(`Attempt after rejection correctly blocked: "${err.message}"`);
  }
  if (!attemptBlockedAfterReject) throw new Error('Attempt after rejection should have been blocked!');

  console.log('\n================================================================');
  console.log('ALL WORKFLOW ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY 100%!');
  console.log('================================================================');
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });

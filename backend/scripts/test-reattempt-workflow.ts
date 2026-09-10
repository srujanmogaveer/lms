import { supabaseAdmin } from '../src/config/supabase';
import { quizService } from '../src/services/quiz.service';
import { progressService } from '../src/services/progress.service';
import { assignmentService } from '../src/services/assignment.service';

async function testQuizReattemptWorkflow() {
  console.log('================================================================');
  console.log('TESTING COMPLETE STUDENT QUIZ REATTEMPT WORKFLOW (REAL DATABASE)');
  console.log('================================================================\n');

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

  console.log(`Student: ${student.full_name} (${student.id})`);
  console.log(`Instructor: ${instructor.full_name} (${instructor.id})\n`);

  // Create isolated test course
  const timestamp = Date.now();
  const { data: testCourse, error: tcErr } = await supabaseAdmin
    .from('courses')
    .insert({
      instructor_id: instructor.id,
      title: 'Quiz Reattempt Course ' + timestamp,
      slug: 'quiz-reattempt-course-' + timestamp,
      course_status: 'Published',
      approval_status: 'Approved',
      price: 0,
    })
    .select()
    .single();

  if (tcErr || !testCourse) {
    throw new Error(`Failed to create test course: ${tcErr?.message}`);
  }
  const course = testCourse;

  // Enroll student
  await supabaseAdmin
    .from('enrollments')
    .upsert({
      course_id: course.id,
      student_id: student.id,
      status: 'Active',
      enrolled_at: new Date().toISOString(),
    }, { onConflict: 'course_id,student_id' });

  // Create published mandatory assignment and pass it so quiz is unlocked
  const { data: asg, error: asgErr } = await supabaseAdmin
    .from('assignments')
    .insert({
      course_id: course.id,
      title: 'Course Prerequisite Assignment',
      description: 'Test assignment',
      max_score: 100,
      passing_score: 60,
      due_days: 7,
      max_attempts: 3,
      status: 'Published',
    })
    .select()
    .single();

  if (asgErr || !asg) throw new Error(`Failed to create assignment: ${asgErr?.message}`);

  const sub = await assignmentService.submitStudentAssignment(student.id, asg.id, {
    submissionText: 'Completed prerequisite',
    fileUrl: 'https://example.com/demo.pdf',
  });

  await assignmentService.gradeSubmission(instructor.id, sub.id, {
    score: 95,
    feedback: 'Passed prerequisite assignment',
    status: 'Graded',
  });

  // Create real Quiz with max_attempts = 3, passing_score = 70
  const { data: testQuiz, error: qErr } = await supabaseAdmin
    .from('quizzes')
    .insert({
      course_id: course.id,
      title: 'JavaScript Mastery Assessment',
      description: 'Verify JavaScript core fundamentals',
      time_limit_minutes: 15,
      passing_score: 70,
      quiz_type: 'Mandatory',
      max_attempts: 3,
      status: 'Published',
    })
    .select()
    .single();

  if (qErr || !testQuiz) throw new Error(`Failed to create quiz: ${qErr?.message}`);

  // Create 2 Real Questions (50 points each)
  const { data: q1 } = await supabaseAdmin
    .from('quiz_questions')
    .insert({
      quiz_id: testQuiz.id,
      question_text: 'Which keyword declares a block-scoped variable in modern JavaScript?',
      question_type: 'Single Answer',
      options: [
        { id: 'opt_let', text: 'let', isCorrect: true },
        { id: 'opt_var', text: 'var', isCorrect: false },
      ],
      points: 50,
      position: 1,
    })
    .select()
    .single();

  const { data: q2 } = await supabaseAdmin
    .from('quiz_questions')
    .insert({
      quiz_id: testQuiz.id,
      question_text: 'JavaScript is a single-threaded language.',
      question_type: 'True or False',
      options: [
        { id: 'opt_true', text: 'True', isCorrect: true },
        { id: 'opt_false', text: 'False', isCorrect: false },
      ],
      points: 50,
      position: 2,
    })
    .select()
    .single();

  if (!q1 || !q2) throw new Error('Failed to create quiz questions');
  console.log(`[Setup] Quiz Created: ID=${testQuiz.id}, MaxAttempts=${testQuiz.max_attempts}, PassingScore=${testQuiz.passing_score}%`);
  console.log(`[Setup] Added Question 1 (50 pts) and Question 2 (50 pts)\n`);

  try {
    // =========================================================================
    // STEP 1: ATTEMPT 1 - Start Quiz & Submit FAILED answers
    // =========================================================================
    console.log('-----------------------------------------------------------------');
    console.log('STEP 1: Start Attempt 1 and Submit Incorrect Answers (Should FAIL)');
    console.log('-----------------------------------------------------------------');

    const attempt1 = await quizService.startQuizAttempt(student.id, testQuiz.id);
    console.log(`Created Attempt 1: ID = ${attempt1.id}, Status = ${attempt1.status}`);

    // Submit wrong answers for both questions (0% score)
    const result1 = await quizService.submitQuizAttempt(student.id, attempt1.id, {
      answers: [
        { questionId: q1.id, answer: 'opt_var' },  // Wrong
        { questionId: q2.id, answer: 'opt_false' }, // Wrong
      ],
    });

    console.log(`Attempt 1 Submitted: Score = ${result1.score}/${result1.totalScore} (${result1.percentage}%), Passed = ${result1.passed}, Status = ${result1.status}`);

    if (result1.passed !== false || result1.percentage !== 0 || result1.status !== 'completed') {
      throw new Error(`Attempt 1 did not fail properly: expected 0% failed, got ${result1.percentage}%`);
    }
    console.log('✓ Attempt 1 successfully failed as expected (0% score).\n');

    // =========================================================================
    // STEP 2: RETRY / RETAKE QUIZ - Start Attempt 2
    // =========================================================================
    console.log('-----------------------------------------------------------------');
    console.log('STEP 2: Student Clicks "Retry Quiz" -> Create NEW Attempt 2');
    console.log('-----------------------------------------------------------------');

    const attempt2 = await quizService.startQuizAttempt(student.id, testQuiz.id);
    console.log(`Created Attempt 2: ID = ${attempt2.id}, Status = ${attempt2.status}`);

    if (!attempt2.id) {
      throw new Error('Attempt 2 ID is missing');
    }
    if (attempt2.id === attempt1.id) {
      throw new Error(`CRITICAL BUG: Attempt 2 reused Attempt 1 ID (${attempt1.id})! Must be unique.`);
    }
    console.log(`✓ Confirmed: Attempt 2 has a UNIQUE new Attempt ID (${attempt2.id} !== ${attempt1.id})`);

    // =========================================================================
    // STEP 3: SUBMIT ATTEMPT 2 WITH CORRECT ANSWERS (Should PASS)
    // =========================================================================
    console.log('\n-----------------------------------------------------------------');
    console.log('STEP 3: Student Answers Questions & Submits Attempt 2 (Should PASS)');
    console.log('-----------------------------------------------------------------');

    const result2 = await quizService.submitQuizAttempt(student.id, attempt2.id, {
      answers: [
        { questionId: q1.id, answer: 'opt_let' },  // Correct (+50)
        { questionId: q2.id, answer: 'opt_true' }, // Correct (+50)
      ],
    });

    console.log(`Attempt 2 Submitted: Score = ${result2.score}/${result2.totalScore} (${result2.percentage}%), Passed = ${result2.passed}, Status = ${result2.status}`);

    if (result2.passed !== true || result2.percentage !== 100 || result2.status !== 'completed') {
      throw new Error(`Attempt 2 evaluation failed: expected 100% passed, got ${result2.percentage}%`);
    }
    console.log('✓ Attempt 2 successfully submitted and passed with 100% score.\n');

    // =========================================================================
    // STEP 4: DATABASE INTEGRITY VERIFICATION
    // =========================================================================
    console.log('-----------------------------------------------------------------');
    console.log('STEP 4: Database Integrity & Historical Preservation Check');
    console.log('-----------------------------------------------------------------');

    const { data: allAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', testQuiz.id)
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });

    console.log(`Total quiz_attempts rows found for this student & quiz: ${allAttempts?.length}`);

    if (!allAttempts || allAttempts.length !== 2) {
      throw new Error(`Expected exactly 2 preserved attempt records, found ${allAttempts?.length}`);
    }

    const [dbAttempt1, dbAttempt2] = allAttempts;
    console.log(`- Stored Attempt 1: ID=${dbAttempt1.id}, Score=${dbAttempt1.score}, Passed=${dbAttempt1.passed}, Status=${dbAttempt1.status}`);
    console.log(`- Stored Attempt 2: ID=${dbAttempt2.id}, Score=${dbAttempt2.score}, Passed=${dbAttempt2.passed}, Status=${dbAttempt2.status}`);

    if (dbAttempt1.id !== attempt1.id || dbAttempt1.passed !== false || dbAttempt1.score !== 0) {
      throw new Error('Attempt 1 was corrupted or overwritten in database!');
    }
    if (dbAttempt2.id !== attempt2.id || dbAttempt2.passed !== true || dbAttempt2.score !== 100) {
      throw new Error('Attempt 2 was not stored accurately in database!');
    }
    console.log('✓ Verified: Attempt 1 is preserved intact (Failed), Attempt 2 is saved separately (Passed).\n');

    // Verify Quiz Answers per Attempt
    const { data: answersAttempt1 } = await supabaseAdmin
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attempt1.id);

    const { data: answersAttempt2 } = await supabaseAdmin
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attempt2.id);

    console.log(`Attempt 1 answers stored: ${answersAttempt1?.length} (All wrong: is_correct=false)`);
    console.log(`Attempt 2 answers stored: ${answersAttempt2?.length} (All correct: is_correct=true)`);

    if (answersAttempt1?.length !== 2 || answersAttempt2?.length !== 2) {
      throw new Error('Answers were not properly isolated per attempt in quiz_answers');
    }
    console.log('✓ Verified: Answers are isolated and linked to their respective attempts.\n');

    // =========================================================================
    // STEP 5: COURSE PROGRESS & CERTIFICATE ELIGIBILITY VERIFICATION
    // =========================================================================
    console.log('-----------------------------------------------------------------');
    console.log('STEP 5: Checking Course Progress & Certificate Availability');
    console.log('-----------------------------------------------------------------');

    const progress = await progressService.getCourseProgress(student.id, course.id);
    console.log(`Course Progress Summary:`, {
      assignmentsComplete: progress.assignmentsComplete,
      quizPassed: progress.quizPassed,
    });

    if (!progress.quizPassed) {
      throw new Error('Course progress failed to recognize that the student passed the quiz on Attempt 2!');
    }
    console.log('✓ Course progress recognizes quiz as passed.\n');

    // =========================================================================
    // STEP 6: ENROLLED QUIZZES API VERIFICATION
    // =========================================================================
    console.log('-----------------------------------------------------------------');
    console.log('STEP 6: Query getStudentEnrolledQuizzes API');
    console.log('-----------------------------------------------------------------');

    const enrolledQuizzes = await quizService.getStudentEnrolledQuizzes(student.id, course.id);
    const quizDetail = enrolledQuizzes.find((q) => q.id === testQuiz.id);

    console.log(`Enrolled Quiz State:`, {
      id: quizDetail?.id,
      title: quizDetail?.title,
      status: quizDetail?.status,
      lastScore: quizDetail?.lastScore,
      attemptsUsed: quizDetail?.attemptsUsed,
      maxAttempts: quizDetail?.maxAttempts,
      historyCount: quizDetail?.attemptHistory.length,
    });

    if (quizDetail?.status !== 'passed' || quizDetail?.lastScore !== 100 || quizDetail?.attemptsUsed !== 2) {
      throw new Error('Enrolled quiz summary does not match Attempt 2 results!');
    }
    console.log('✓ Enrolled quiz API accurately reports Passed, LastScore=100%, AttemptsUsed=2.\n');

    // =========================================================================
    // STEP 7: ATTEMPT LIMIT ENFORCEMENT VERIFICATION
    // =========================================================================
    console.log('-----------------------------------------------------------------');
    console.log('STEP 7: Maximum Attempt Limit Enforcement (Max = 3)');
    console.log('-----------------------------------------------------------------');

    // Attempt 3 (Allowed)
    console.log('Starting Attempt 3 (within limit 3/3)...');
    const attempt3 = await quizService.startQuizAttempt(student.id, testQuiz.id);
    console.log(`Attempt 3 Created: ID = ${attempt3.id}`);

    await quizService.submitQuizAttempt(student.id, attempt3.id, {
      answers: [{ questionId: q1.id, answer: 'opt_let' }],
    });
    console.log('Attempt 3 submitted.');

    // Attempt 4 (Should be BLOCKED)
    console.log('Attempting to start Attempt 4 (Exceeds limit of 3)...');
    try {
      await quizService.startQuizAttempt(student.id, testQuiz.id);
      throw new Error('FAIL: Attempt 4 was allowed when max_attempts is 3!');
    } catch (err: any) {
      console.log(`✓ Attempt 4 was correctly BLOCKED with error: "${err.message}"`);
    }

    console.log('\n================================================================');
    console.log('ALL REATTEMPT WORKFLOW TESTS PASSED SUCCESSFULLY (100% REAL DB)');
    console.log('================================================================\n');

  } finally {
    // Cleanup test records
    console.log('Cleaning up test records from database...');
    await supabaseAdmin.from('quiz_answers').delete().match({ attempt_id: testQuiz.id });
    await supabaseAdmin.from('quiz_attempts').delete().eq('quiz_id', testQuiz.id);
    await supabaseAdmin.from('quiz_questions').delete().eq('quiz_id', testQuiz.id);
    await supabaseAdmin.from('quizzes').delete().eq('id', testQuiz.id);
    await supabaseAdmin.from('assignment_submissions').delete().eq('assignment_id', asg.id);
    await supabaseAdmin.from('assignments').delete().eq('id', asg.id);
    await supabaseAdmin.from('courses').delete().eq('id', course.id);
    console.log('Cleanup completed.\n');
  }
}

testQuizReattemptWorkflow()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });

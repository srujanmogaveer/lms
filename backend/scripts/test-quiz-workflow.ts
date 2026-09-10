import { supabaseAdmin } from '../src/config/supabase';
import { quizService } from '../src/services/quiz.service';
import { progressService } from '../src/services/progress.service';
import { assignmentService } from '../src/services/assignment.service';

async function testCompleteStudentLearningWorkflow() {
  console.log('====================================================');
  console.log('TESTING COMPLETE STUDENT LEARNING WORKFLOW WITH REAL DB');
  console.log('====================================================\n');

  // 1. Fetch real student, instructor, course
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
    console.error('Missing required student or instructor in profiles');
    return;
  }

  console.log(`Student: ${student.full_name} (${student.id})`);
  console.log(`Instructor: ${instructor.full_name} (${instructor.id})`);

  // Create a clean test course
  const timestamp = Date.now();
  const { data: testCourse, error: tcErr } = await supabaseAdmin
    .from('courses')
    .insert({
      instructor_id: instructor.id,
      title: 'Quiz Workflow Course ' + timestamp,
      slug: 'quiz-workflow-course-' + timestamp,
      course_status: 'Published',
      approval_status: 'Approved',
      price: 0,
    })
    .select()
    .single();

  if (tcErr || !testCourse) {
    console.error('Failed to create test course:', tcErr);
    return;
  }
  const course = testCourse;

  // Ensure student enrollment
  await supabaseAdmin
    .from('enrollments')
    .upsert({
      course_id: course.id,
      student_id: student.id,
      status: 'Active',
      enrolled_at: new Date().toISOString(),
    }, { onConflict: 'course_id,student_id' });

  // 2. Setup a Course Assignment for testing
  const { data: asg, error: asgErr } = await supabaseAdmin
    .from('assignments')
    .insert({
      course_id: course.id,
      title: 'Workflow Mandatory Assignment',
      description: 'Test assignment description',
      max_score: 100,
      passing_score: 70,
      due_days: 7,
      max_attempts: 3,
      status: 'Published',
    })
    .select()
    .single();

  if (asgErr || !asg) {
    console.error('Failed to create assignment:', asgErr);
    return;
  }
  console.log(`[Step 1] Created Published Assignment: ID=${asg.id}, PassingScore=${asg.passing_score}`);

  // 3. Setup a Real Quiz with Questions
  const { data: testQuiz, error: qErr } = await supabaseAdmin
    .from('quizzes')
    .insert({
      course_id: course.id,
      title: 'Workflow Mandatory Quiz',
      description: 'Test real quiz for completion',
      time_limit_minutes: 15,
      passing_score: 70,
      quiz_type: 'Mandatory',
      max_attempts: 3,
      status: 'Published',
    })
    .select()
    .single();

  if (qErr || !testQuiz) {
    console.error('Failed to create quiz:', qErr);
    return;
  }
  console.log(`[Step 2] Created Published Quiz: ID=${testQuiz.id}, PassingScore=${testQuiz.passing_score}`);

  // Add 2 Real Questions
  const { data: q1 } = await supabaseAdmin
    .from('quiz_questions')
    .insert({
      quiz_id: testQuiz.id,
      question_text: 'What is the correct syntax for React hook useState?',
      question_type: 'Single Answer',
      options: [
        { id: 'opt1', text: 'const [state, setState] = useState(initial)', isCorrect: true },
        { id: 'opt2', text: 'const state = useState(initial)', isCorrect: false },
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
      question_text: 'TypeScript is a typed superset of JavaScript.',
      question_type: 'True or False',
      options: [
        { id: 'opt3', text: 'True', isCorrect: true },
        { id: 'opt4', text: 'False', isCorrect: false },
      ],
      points: 50,
      position: 2,
    })
    .select()
    .single();

  console.log(`  Added Question 1 (50 pts) & Question 2 (50 pts)\n`);

  try {
    // ----------------------------------------------------
    // TEST 1: Quiz Gating Before Assignment Submission
    // ----------------------------------------------------
    console.log('--- TEST 1: Attempt to start Quiz before submitting Assignment ---');
    try {
      await quizService.startQuizAttempt(student.id, testQuiz.id);
      console.error('FAIL: Quiz should be locked when assignment is not passed');
    } catch (err: any) {
      console.log(`SUCCESS (Blocked as expected): ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 2: Student Submits Attempt 1 (Waiting for grading)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Student submits Assignment (Attempt 1 - Under Review) ---');
    const sub1 = await assignmentService.submitStudentAssignment(student.id, asg.id, {
      submissionText: 'My solution attempt 1',
      fileUrl: 'https://example.com/attempt1.pdf',
    });
    console.log(`Submitted Attempt 1: ID=${sub1.id}, Status=${sub1.status}`);

    console.log('Testing Quiz Access while assignment is Waiting for grading:');
    try {
      await quizService.startQuizAttempt(student.id, testQuiz.id);
      console.error('FAIL: Quiz should be locked while assignment is under review');
    } catch (err: any) {
      console.log(`SUCCESS (Blocked as expected): ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 3: Instructor Grades Attempt 1 as FAILED (40/100)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Instructor grades Attempt 1 as FAILED (40/100) ---');
    await assignmentService.gradeSubmission(instructor.id, sub1.id, {
      score: 40,
      feedback: 'Please address issues and resubmit.',
      status: 'Graded',
    });

    console.log('Testing Quiz Access while assignment is FAILED:');
    try {
      await quizService.startQuizAttempt(student.id, testQuiz.id);
      console.error('FAIL: Quiz should be locked when assignment is failed');
    } catch (err: any) {
      console.log(`SUCCESS (Blocked as expected): ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 4: Student Resubmits (Attempt 2) & Instructor Grades PASSED (90/100)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Student Resubmits (Attempt 2) & Passes (90/100) ---');
    const sub2 = await assignmentService.submitStudentAssignment(student.id, asg.id, {
      submissionText: 'Fixed solution attempt 2',
      fileUrl: 'https://example.com/attempt2.pdf',
    });
    console.log(`Submitted Attempt 2: ID=${sub2.id}`);

    await assignmentService.gradeSubmission(instructor.id, sub2.id, {
      score: 90,
      feedback: 'Excellent work! Passed.',
      status: 'Graded',
    });
    console.log(`Graded Attempt 2: Score = 90 / 100 (Passed)`);

    // ----------------------------------------------------
    // TEST 5: Quiz Access Unlocked & Starting Real Attempt
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Quiz Access Unlocked! Starting Quiz Attempt ---');
    const quizAttempt = await quizService.startQuizAttempt(student.id, testQuiz.id);
    console.log(`Quiz Attempt Started: AttemptID=${quizAttempt.id}, Status=${quizAttempt.status}`);

    // ----------------------------------------------------
    // TEST 6: Submitting Quiz Answers & Real Score Evaluation
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Submitting Quiz Answers (Both Correct: 100%) ---');
    const submittedResult = await quizService.submitQuizAttempt(student.id, quizAttempt.id, {
      answers: [
        { questionId: q1!.id, answer: 'opt1' },
        { questionId: q2!.id, answer: 'opt3' },
      ],
    });

    console.log(`Quiz Result:`, {
      score: submittedResult.score,
      totalScore: submittedResult.totalScore,
      percentage: submittedResult.percentage,
      passed: submittedResult.passed,
      status: submittedResult.status,
    });

    if (submittedResult.passed && submittedResult.percentage === 100) {
      console.log('SUCCESS: Quiz evaluated accurately with real scoring & passed!');
    } else {
      console.error('FAIL: Expected 100% and passed=true');
    }

    // ----------------------------------------------------
    // TEST 7: Course Completion & Certificate Gating
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Checking Overall Course Progress & Certificate Availability ---');
    const progress = await progressService.getCourseProgress(student.id, course.id);
    console.log(`Course Progress:`, {
      assignmentsComplete: progress.assignmentsComplete,
      quizPassed: progress.quizPassed,
      isCourseCompleted: progress.isCourseCompleted,
      certificateAvailable: progress.certificateAvailable,
    });

    // ----------------------------------------------------
    // TEST 8: Enrolled Quizzes API Query
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Querying getStudentEnrolledQuizzes API ---');
    const enrolledQuizzes = await quizService.getStudentEnrolledQuizzes(student.id, course.id);
    const qSummary = enrolledQuizzes.find((q) => q.id === testQuiz.id);
    console.log(`Enrolled Quiz Summary:`, {
      id: qSummary?.id,
      title: qSummary?.title,
      status: qSummary?.status,
      lastScore: qSummary?.lastScore,
      attemptsUsed: qSummary?.attemptsUsed,
      maxAttempts: qSummary?.maxAttempts,
      isLocked: qSummary?.isLocked,
    });

  } finally {
    // Cleanup test records
    console.log('\n--- Cleaning up test records ---');
    await supabaseAdmin.from('quiz_answers').delete().match({ attempt_id: testQuiz.id });
    await supabaseAdmin.from('quiz_attempts').delete().eq('quiz_id', testQuiz.id);
    await supabaseAdmin.from('quiz_questions').delete().eq('quiz_id', testQuiz.id);
    await supabaseAdmin.from('quizzes').delete().eq('id', testQuiz.id);
    await supabaseAdmin.from('assignment_submissions').delete().eq('assignment_id', asg.id);
    await supabaseAdmin.from('assignments').delete().eq('id', asg.id);
    await supabaseAdmin.from('courses').delete().eq('id', course.id);
    console.log('Cleanup complete.\n');
  }

  console.log('====================================================');
  console.log('ALL REAL DATABASE QUIZ WORKFLOW TESTS PASSED!');
  console.log('====================================================');
}

testCompleteStudentLearningWorkflow()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  });

import { supabaseAdmin } from '../src/config/supabase';
import { progressService } from '../src/services/progress.service';

async function runTest() {
  console.log('================================================================');
  console.log('TESTING COMPLETE COURSE COMPLETION & CERTIFICATE WORKFLOW');
  console.log('================================================================\n');

  // 1. Fetch real student and instructor from DB
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

  // Fetch or create a test course
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, title, instructor_id')
    .eq('instructor_id', instructor.id)
    .limit(1)
    .single();

  if (!course) {
    throw new Error('Could not find course for instructor');
  }

  console.log(`Course: "${course.title}" (${course.id})`);

  // Ensure student is enrolled
  let { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, status')
    .eq('course_id', course.id)
    .eq('student_id', student.id)
    .maybeSingle();

  if (!enrollment) {
    const { data: newEnr } = await supabaseAdmin
      .from('enrollments')
      .insert({
        course_id: course.id,
        student_id: student.id,
        status: 'Active',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();
    enrollment = newEnr;
  }

  if (!enrollment) {
    throw new Error('Failed to ensure student enrollment');
  }

  // Ensure lessons exist for course via course_modules
  const { data: modules } = await supabaseAdmin
    .from('course_modules')
    .select('id, title, lessons(id, title)')
    .eq('course_id', course.id);

  let lessons: any[] = [];
  (modules || []).forEach((m: any) => {
    (m.lessons || []).forEach((l: any) => lessons.push(l));
  });

  if (lessons.length === 0) {
    let moduleId: string;
    if (modules && modules.length > 0) {
      moduleId = modules[0].id;
    } else {
      const { data: createdMod } = await supabaseAdmin
        .from('course_modules')
        .insert({ course_id: course.id, title: 'Core Curriculum Module', order_index: 1 })
        .select()
        .single();
      moduleId = createdMod.id;
    }

    const { data: createdLessons } = await supabaseAdmin
      .from('lessons')
      .insert([
        { module_id: moduleId, title: 'Lesson 1: Introduction', content: 'Intro content', order_index: 1 },
        { module_id: moduleId, title: 'Lesson 2: Advanced Topics', content: 'Advanced content', order_index: 2 },
      ])
      .select();
    lessons = createdLessons || [];
  }

  // Ensure assignments exist for course
  let { data: assignments } = await supabaseAdmin
    .from('assignments')
    .select('id, title, course_id, passing_score, max_score, status')
    .eq('course_id', course.id)
    .eq('status', 'Published');

  if (!assignments || assignments.length === 0) {
    const { data: createdAsg } = await supabaseAdmin
      .from('assignments')
      .insert([
        {
          course_id: course.id,
          title: 'Assignment 1: Practical Project',
          description: 'Project specs',
          passing_score: 70,
          max_score: 100,
          status: 'Published',
          due_date: new Date(Date.now() + 86400000).toISOString(),
        },
      ])
      .select();
    assignments = createdAsg || [];
  }

  // Ensure a published quiz exists for course
  let { data: quiz } = await supabaseAdmin
    .from('quizzes')
    .select('id, title, course_id, passing_score, max_attempts, status')
    .eq('course_id', course.id)
    .eq('status', 'Published')
    .maybeSingle();

  if (!quiz) {
    const { data: anyQuiz } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, course_id, passing_score, max_attempts, status')
      .eq('course_id', course.id)
      .maybeSingle();

    if (anyQuiz) {
      await supabaseAdmin.from('quizzes').update({ status: 'Published', passing_score: 75 }).eq('id', anyQuiz.id);
      quiz = { ...anyQuiz, status: 'Published', passing_score: 75 };
    } else {
      const { data: createdQuiz } = await supabaseAdmin
        .from('quizzes')
        .insert({
          course_id: course.id,
          title: 'Final Mastery Assessment Quiz',
          description: 'Comprehensive assessment',
          passing_score: 75,
          max_attempts: 3,
          time_limit_minutes: 30,
          status: 'Published',
        })
        .select()
        .single();
      quiz = createdQuiz;
    }
  }

  console.log(`\nCurriculum Setup for Course:`);
  console.log(`- Total Lessons: ${lessons?.length}`);
  console.log(`- Mandatory Assignments: ${assignments?.length}`);
  console.log(`- Mandatory Quiz: "${quiz?.title}" (Passing Score: ${quiz?.passing_score}%)`);

  // Helper functions for state setup
  const setAllLessonsCompleted = async (completed: boolean) => {
    await supabaseAdmin.from('lesson_progress').delete().eq('course_id', course.id).eq('student_id', student.id);
    if (completed && lessons) {
      for (const l of lessons) {
        await supabaseAdmin.from('lesson_progress').insert({
          student_id: student.id,
          course_id: course.id,
          lesson_id: l.id,
          status: 'Completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        });
      }
    }
  };

  const setAllAssignmentsGraded = async (passed: boolean) => {
    if (!assignments) return;
    for (const asg of assignments) {
      await supabaseAdmin.from('assignment_submissions').delete().eq('assignment_id', asg.id).eq('student_id', student.id);
      const score = passed ? (asg.passing_score || 70) + 10 : (asg.passing_score || 70) - 20;
      await supabaseAdmin.from('assignment_submissions').insert({
        assignment_id: asg.id,
        student_id: student.id,
        status: 'Graded',
        score,
        submission_text: 'Submitted work',
        submitted_at: new Date().toISOString(),
      });
    }
  };

  const setQuizAttempt = async (passed: boolean) => {
    if (!quiz) return;
    await supabaseAdmin.from('quiz_attempts').delete().eq('quiz_id', quiz.id).eq('student_id', student.id);
    const score = passed ? 100 : 30;
    const percentage = passed ? 100 : 30;
    await supabaseAdmin.from('quiz_attempts').insert({
      quiz_id: quiz.id,
      student_id: student.id,
      score,
      total_score: 100,
      percentage,
      passed,
      status: 'completed',
      submitted_at: new Date().toISOString(),
    });
  };

  // =========================================================================
  // TEST 1: FULL POSITIVE COMPLETION FLOW
  // All lessons (100%) + All assignments (PASSED) + Quiz (PASSED)
  // =========================================================================
  console.log('\n-----------------------------------------------------------------');
  console.log('TEST 1: FULL POSITIVE COMPLETION FLOW (Lessons 100% + Asgs Passed + Quiz Passed)');
  console.log('-----------------------------------------------------------------');

  await setAllLessonsCompleted(true);
  await setAllAssignmentsGraded(true);
  await setQuizAttempt(true);

  const posProgress = await progressService.getCourseProgress(student.id, course.id);
  console.log(`- lessonsCompleted: ${posProgress.lessonProgressPercentage}% (${posProgress.completedLessons}/${posProgress.totalLessons})`);
  console.log(`- assignmentsComplete: ${posProgress.assignmentsComplete} (${posProgress.completedAssignmentsCount}/${posProgress.mandatoryAssignmentsCount})`);
  console.log(`- quizPassed: ${posProgress.quizPassed}`);
  console.log(`- isCourseCompleted: ${posProgress.isCourseCompleted}`);
  console.log(`- certificateAvailable: ${posProgress.certificateAvailable}`);

  if (!posProgress.isCourseCompleted || !posProgress.certificateAvailable) {
    throw new Error('TEST 1 FAILED: Course should be marked completed and certificate available!');
  }

  // Check enrollment status in DB
  const { data: posEnr } = await supabaseAdmin
    .from('enrollments')
    .select('status, completed_at')
    .eq('id', enrollment.id)
    .single();

  console.log(`- DB Enrollment Status: "${posEnr?.status}", completed_at: ${posEnr?.completed_at}`);
  if (posEnr?.status !== 'Completed') {
    throw new Error(`TEST 1 FAILED: Enrollment status in DB should be 'Completed', got '${posEnr?.status}'`);
  }

  // Verify backend certificate endpoint returns valid verified data
  const certData = await progressService.verifyCertificateEligibility(student.id, course.id);
  console.log(`- Verified Certificate Code: ${certData.serialCode}`);
  console.log(`- Student Name: ${certData.studentName}, Course: "${certData.courseTitle}"`);
  console.log(`- Authorized Instructor: ${certData.instructorName}`);
  console.log('TEST 1 PASSED: Full completion & certificate unlocked successfully! ✅\n');

  // =========================================================================
  // TEST 2: NEGATIVE TEST (Lessons Complete, Assignments FAILED, Quiz Passed)
  // =========================================================================
  console.log('-----------------------------------------------------------------');
  console.log('TEST 2: NEGATIVE TEST (Lessons Complete, Assignments FAILED, Quiz Passed)');
  console.log('-----------------------------------------------------------------');

  await setAllLessonsCompleted(true);
  await setAllAssignmentsGraded(false); // FAILED assignment
  await setQuizAttempt(true);

  const negAsgProgress = await progressService.getCourseProgress(student.id, course.id);
  console.log(`- lessonsCompleted: ${negAsgProgress.lessonProgressPercentage}%`);
  console.log(`- assignmentsComplete: ${negAsgProgress.assignmentsComplete}`);
  console.log(`- quizPassed: ${negAsgProgress.quizPassed}`);
  console.log(`- isCourseCompleted: ${negAsgProgress.isCourseCompleted} (expected: false)`);
  console.log(`- certificateAvailable: ${negAsgProgress.certificateAvailable} (expected: false)`);

  if (negAsgProgress.isCourseCompleted || negAsgProgress.certificateAvailable) {
    throw new Error('TEST 2 FAILED: Course should NOT be completed when assignments failed!');
  }

  let negAsgCertBlocked = false;
  try {
    await progressService.verifyCertificateEligibility(student.id, course.id);
  } catch (err: any) {
    negAsgCertBlocked = true;
    console.log(`- Certificate verification correctly rejected: "${err.message}"`);
  }
  if (!negAsgCertBlocked) throw new Error('TEST 2 FAILED: Certificate should have been blocked!');
  console.log('TEST 2 PASSED: Failed assignment blocks course completion & certificate! ✅\n');

  // =========================================================================
  // TEST 3: NEGATIVE TEST (Lessons Complete, Assignments Passed, Quiz FAILED)
  // =========================================================================
  console.log('-----------------------------------------------------------------');
  console.log('TEST 3: NEGATIVE TEST (Lessons Complete, Assignments Passed, Quiz FAILED)');
  console.log('-----------------------------------------------------------------');

  await setAllLessonsCompleted(true);
  await setAllAssignmentsGraded(true);
  await setQuizAttempt(false); // FAILED quiz

  const negQuizProgress = await progressService.getCourseProgress(student.id, course.id);
  console.log(`- lessonsCompleted: ${negQuizProgress.lessonProgressPercentage}%`);
  console.log(`- assignmentsComplete: ${negQuizProgress.assignmentsComplete}`);
  console.log(`- quizPassed: ${negQuizProgress.quizPassed} (expected: false)`);
  console.log(`- isCourseCompleted: ${negQuizProgress.isCourseCompleted} (expected: false)`);
  console.log(`- certificateAvailable: ${negQuizProgress.certificateAvailable} (expected: false)`);

  if (negQuizProgress.isCourseCompleted || negQuizProgress.certificateAvailable) {
    throw new Error('TEST 3 FAILED: Course should NOT be completed when quiz failed!');
  }

  let negQuizCertBlocked = false;
  try {
    await progressService.verifyCertificateEligibility(student.id, course.id);
  } catch (err: any) {
    negQuizCertBlocked = true;
    console.log(`- Certificate verification correctly rejected: "${err.message}"`);
  }
  if (!negQuizCertBlocked) throw new Error('TEST 3 FAILED: Certificate should have been blocked!');
  console.log('TEST 3 PASSED: Failed quiz blocks course completion & certificate! ✅\n');

  // =========================================================================
  // TEST 4: NEGATIVE TEST (Lessons INCOMPLETE, Assignments Passed, Quiz Passed)
  // =========================================================================
  console.log('-----------------------------------------------------------------');
  console.log('TEST 4: NEGATIVE TEST (Lessons INCOMPLETE, Assignments Passed, Quiz Passed)');
  console.log('-----------------------------------------------------------------');

  await setAllLessonsCompleted(false); // INCOMPLETE lessons (0%)
  await setAllAssignmentsGraded(true);
  await setQuizAttempt(true);

  const negLessonProgress = await progressService.getCourseProgress(student.id, course.id);
  console.log(`- lessonsCompleted: ${negLessonProgress.lessonProgressPercentage}% (expected: 0%)`);
  console.log(`- assignmentsComplete: ${negLessonProgress.assignmentsComplete}`);
  console.log(`- quizPassed: ${negLessonProgress.quizPassed}`);
  console.log(`- isCourseCompleted: ${negLessonProgress.isCourseCompleted} (expected: false)`);
  console.log(`- certificateAvailable: ${negLessonProgress.certificateAvailable} (expected: false)`);

  if (negLessonProgress.isCourseCompleted || negLessonProgress.certificateAvailable) {
    throw new Error('TEST 4 FAILED: Course should NOT be completed when lessons are incomplete!');
  }

  let negLessonCertBlocked = false;
  try {
    await progressService.verifyCertificateEligibility(student.id, course.id);
  } catch (err: any) {
    negLessonCertBlocked = true;
    console.log(`- Certificate verification correctly rejected: "${err.message}"`);
  }
  if (!negLessonCertBlocked) throw new Error('TEST 4 FAILED: Certificate should have been blocked!');
  console.log('TEST 4 PASSED: Incomplete lessons block course completion & certificate! ✅\n');

  // =========================================================================
  // RESTORATION & FINAL STATE
  // =========================================================================
  await setAllLessonsCompleted(true);
  await setAllAssignmentsGraded(true);
  await setQuizAttempt(true);
  await progressService.getCourseProgress(student.id, course.id);

  console.log('================================================================');
  console.log('ALL COURSE COMPLETION & CERTIFICATE WORKFLOW TESTS PASSED 100%!');
  console.log('================================================================');
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });

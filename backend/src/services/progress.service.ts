import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { LessonProgress, StudentCourseProgressSummary } from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class ProgressService {
  /**
   * Helper to format DB LessonProgress row
   */
  private formatLessonProgress(row: any): LessonProgress {
    return {
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      status: row.status,
      progressPercentage: Number(row.progress_percentage || 0),
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
      lastAccessedAt: row.last_accessed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 1. Validate Student Enrollment and Course Status
   */
  public async verifyStudentCourseAccess(studentId: string, courseId: string): Promise<any> {
    // 1. Verify Course exists, is Published & Approved
    const { data: course, error: cErr } = await supabaseAdmin
      .from('courses')
      .select('id, title, course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (cErr || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Course is not available for student learning');
    }

    // 2. Verify Student is actively enrolled
    const { data: enrollment, error: eErr } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (eErr || !enrollment) {
      throw ApiError.forbidden('You must be enrolled in this course to access its lessons');
    }

    if (enrollment.status === 'Cancelled') {
      throw ApiError.forbidden('Your enrollment in this course has been cancelled');
    }

    return { course, enrollment };
  }

  /**
   * 2. Verify Lesson belongs to Course
   */
  public async verifyLessonBelongsToCourse(courseId: string, lessonId: string): Promise<any> {
    const { data: lesson, error: lErr } = await supabaseAdmin
      .from('lessons')
      .select('id, module_id, course_modules(course_id)')
      .eq('id', lessonId)
      .maybeSingle();

    if (lErr || !lesson) {
      throw ApiError.notFound('Lesson not found');
    }

    const actualCourseId = (lesson.course_modules as any)?.course_id;
    if (actualCourseId !== courseId) {
      throw ApiError.badRequest('Lesson does not belong to the selected course');
    }

    return lesson;
  }

  /**
   * 3. Get Student Lesson Progress for a Course (List of completed lesson IDs)
   */
  public async getStudentCourseLessonsProgress(
    studentId: string,
    courseId: string
  ): Promise<LessonProgress[]> {
    await this.verifyStudentCourseAccess(studentId, courseId);

    const { data: rows, error } = await supabaseAdmin
      .from('lesson_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) {
      logger.error('Error fetching lesson progress:', error);
      throw ApiError.internal(`Failed to fetch lesson progress: ${error.message}`);
    }

    return (rows || []).map((row) => this.formatLessonProgress(row));
  }

  /**
   * 4. Complete a Lesson
   */
  public async completeLesson(
    studentId: string,
    courseId: string,
    lessonId: string
  ): Promise<LessonProgress> {
    await this.verifyStudentCourseAccess(studentId, courseId);
    await this.verifyLessonBelongsToCourse(courseId, lessonId);

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('lesson_progress')
      .upsert(
        {
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'Completed',
          progress_percentage: 100.0,
          completed_at: now,
          last_accessed_at: now,
          updated_at: now,
        },
        { onConflict: 'student_id,lesson_id' }
      )
      .select('*')
      .single();

    if (error || !data) {
      logger.error('Error marking lesson complete:', error);
      throw ApiError.internal(`Failed to update lesson progress: ${error?.message}`);
    }

    return this.formatLessonProgress(data);
  }

  /**
   * 5. Start / Track In_Progress Lesson Access
   */
  public async trackLessonAccess(
    studentId: string,
    courseId: string,
    lessonId: string
  ): Promise<LessonProgress> {
    await this.verifyStudentCourseAccess(studentId, courseId);
    await this.verifyLessonBelongsToCourse(courseId, lessonId);

    const now = new Date().toISOString();

    // Check if progress already exists
    const { data: existing } = await supabaseAdmin
      .from('lesson_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existing) {
      // Just update last_accessed_at without overriding Completed status
      const { data: updated, error } = await supabaseAdmin
        .from('lesson_progress')
        .update({
          last_accessed_at: now,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error || !updated) {
        throw ApiError.internal('Failed to update lesson access timestamp');
      }
      return this.formatLessonProgress(updated);
    }

    // Insert new In_Progress record
    const { data: created, error: insertErr } = await supabaseAdmin
      .from('lesson_progress')
      .insert({
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        status: 'In_Progress',
        progress_percentage: 0.0,
        started_at: now,
        last_accessed_at: now,
      })
      .select('*')
      .single();

    if (insertErr || !created) {
      logger.error('Error tracking lesson access:', insertErr);
      throw ApiError.internal(`Failed to track lesson access: ${insertErr?.message}`);
    }

    return this.formatLessonProgress(created);
  }

  /**
   * 6. Calculate Comprehensive Course Progress Summary
   */
  public async getCourseProgress(
    studentId: string,
    courseId: string
  ): Promise<StudentCourseProgressSummary> {
    const { course, enrollment } = await this.verifyStudentCourseAccess(studentId, courseId);

    // 1. Fetch all lessons in this course
    const { data: modules, error: mErr } = await supabaseAdmin
      .from('course_modules')
      .select('id, lessons(id)')
      .eq('course_id', courseId);

    if (mErr) {
      throw ApiError.internal(`Failed to fetch curriculum modules: ${mErr.message}`);
    }

    const allLessonIds: string[] = [];
    (modules || []).forEach((m: any) => {
      const lessons = (m.lessons as any[]) || [];
      lessons.forEach((l) => allLessonIds.push(l.id));
    });

    const totalLessons = allLessonIds.length;

    // 2. Fetch completed lesson records for this student specifically for this course's lessons
    let completedLessons = 0;
    let completedLessonIds: string[] = [];

    if (totalLessons > 0) {
      const { data: progressRows, error: pErr } = await supabaseAdmin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', studentId)
        .eq('status', 'Completed')
        .in('lesson_id', allLessonIds);

      if (pErr) {
        throw ApiError.internal(`Failed to fetch completed lessons: ${pErr.message}`);
      }

      completedLessonIds = (progressRows || []).map((row) => row.lesson_id);
      completedLessons = completedLessonIds.length;
    }

    const lessonProgressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // 3. Check Mandatory Assignments for this course
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, max_score, passing_score, status')
      .eq('course_id', courseId)
      .eq('status', 'Published');

    const assignmentsList = assignments || [];
    const mandatoryAssignmentsCount = assignmentsList.length;

    let submittedAssignmentsCount = 0;
    let gradedAssignmentsCount = 0;
    let passedAssignmentsCount = 0;

    if (mandatoryAssignmentsCount > 0) {
      const assignmentIds = assignmentsList.map((a) => a.id);
      const { data: submissions } = await supabaseAdmin
        .from('assignment_submissions')
        .select('assignment_id, status, score, attempt_number')
        .in('assignment_id', assignmentIds)
        .eq('student_id', studentId);

      const submissionList = submissions || [];
      const submissionsByAsgMap = new Map<string, any[]>();
      submissionList.forEach((s) => {
        const list = submissionsByAsgMap.get(s.assignment_id) || [];
        list.push(s);
        submissionsByAsgMap.set(s.assignment_id, list);
      });

      assignmentsList.forEach((asg) => {
        const asgSubs = submissionsByAsgMap.get(asg.id) || [];
        if (asgSubs.length > 0) {
          submittedAssignmentsCount++;
          // Check if at least one attempt has been graded
          const hasGradedAttempt = asgSubs.some((s) => s.status === 'Graded');
          if (hasGradedAttempt) {
            gradedAssignmentsCount++;
          }
          // Check if ANY attempt has passed (score >= passing_score)
          const passingScore = asg.passing_score !== undefined && asg.passing_score !== null ? asg.passing_score : 60;
          const hasPassedAttempt = asgSubs.some(
            (s) => s.status === 'Graded' && s.score !== null && (s.score ?? 0) >= passingScore
          );
          if (hasPassedAttempt) {
            passedAssignmentsCount++;
          }
        }
      });
    }

    const hasLessons = totalLessons > 0;
    const lessonsCompleted = hasLessons && completedLessons >= totalLessons;
    const assignmentsSubmitted = mandatoryAssignmentsCount === 0 || submittedAssignmentsCount >= mandatoryAssignmentsCount;
    const assignmentsGraded = mandatoryAssignmentsCount === 0 || gradedAssignmentsCount >= mandatoryAssignmentsCount;
    const assignmentsComplete = mandatoryAssignmentsCount === 0 || passedAssignmentsCount >= mandatoryAssignmentsCount;

    // 4. Check Mandatory Quiz for this course (ONE mandatory quiz rule)
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('id, passing_score, status')
      .eq('course_id', courseId)
      .eq('status', 'Published')
      .maybeSingle();

    const hasMandatoryQuiz = Boolean(quiz);
    let quizPassed = false;

    if (quiz) {
      const { data: passedAttempt } = await supabaseAdmin
        .from('quiz_attempts')
        .select('id, passed')
        .eq('quiz_id', quiz.id)
        .eq('student_id', studentId)
        .eq('passed', true)
        .maybeSingle();

      quizPassed = Boolean(passedAttempt);
    } else {
      quizPassed = true; // No quiz in course
    }

    // 5. Course Completion Rule:
    // ALL conditions must be true:
    // 1) Course must have lessons and all required lessons completed (100%)
    // 2) All required assignments submitted, graded, and PASSED
    // 3) Mandatory quiz PASSED (if quiz exists)
    const isCourseCompleted =
      hasLessons &&
      lessonsCompleted &&
      assignmentsSubmitted &&
      assignmentsGraded &&
      assignmentsComplete &&
      quizPassed;

    const certificateAvailable = isCourseCompleted;

    // If completed and enrollment not yet marked completed, update enrollment
    if (isCourseCompleted && enrollment.status !== 'Completed') {
      await supabaseAdmin
        .from('enrollments')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);

      // Dispatch certificate notification to student (asynchronous & non-blocking)
      try {
        await NotificationService.createNotification({
          userId: studentId,
          title: 'Certificate Issued — Congratulations!',
          message: `You completed 100% of "${course.title}". Your verifiable certificate is ready to view and download!`,
          type: 'success',
          category: 'course',
          actionUrl: '/student/certificates',
          sourceId: courseId,
        });
      } catch (notifErr: any) {
        logger.warn(`Failed to dispatch certificate notification: ${notifErr.message}`);
      }
    } else if (!isCourseCompleted && enrollment.status === 'Completed') {
      await supabaseAdmin
        .from('enrollments')
        .update({
          status: 'Active',
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);
    }

    return {
      courseId,
      studentId,
      totalLessons,
      completedLessons,
      lessonProgressPercentage,
      completedLessonIds,
      totalAssignments: mandatoryAssignmentsCount,
      completedAssignments: submittedAssignmentsCount,
      mandatoryAssignmentsCount,
      completedAssignmentsCount: submittedAssignmentsCount,
      assignmentsSubmitted,
      assignmentsGraded,
      assignmentsComplete,
      quizExists: hasMandatoryQuiz,
      hasMandatoryQuiz,
      quizPassed,
      courseComplete: isCourseCompleted,
      isCourseCompleted,
      certificateAvailable,
      enrolledAt: enrollment.enrolled_at,
      overallProgressPercentage: lessonProgressPercentage,
    };
  }

  /**
   * 7. Verify Certificate Eligibility on Backend
   */
  public async verifyCertificateEligibility(
    studentId: string,
    courseId: string
  ): Promise<any> {
    const progress = await this.getCourseProgress(studentId, courseId);

    if (!progress.certificateAvailable) {
      throw ApiError.forbidden(
        'Certificate is not available yet. All lessons must be completed, assignments submitted and graded, and the final quiz passed.'
      );
    }

    // Fetch Student & Course information for verified certificate data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', studentId)
      .single();

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id, title, short_description, full_description, thumbnail, duration_hours, difficulty, instructor_id')
      .eq('id', courseId)
      .single();

    let instructorProfile: any = null;
    if (course?.instructor_id) {
      const { data: inst } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, headline, qualification')
        .eq('id', course.instructor_id)
        .maybeSingle();
      instructorProfile = inst;
    }

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, enrolled_at, completed_at, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    const completedDate = enrollment?.completed_at ? new Date(enrollment.completed_at) : new Date();
    const issueYear = completedDate.getFullYear();
    const stableCertCode = `EDU-${issueYear}-${courseId.slice(0, 4).toUpperCase()}-${enrollment?.id ? enrollment.id.slice(0, 8).toUpperCase() : studentId.slice(0, 8).toUpperCase()}`;

    // Get quiz score if available
    let quizScore = 100;
    let quizPassingScore = 75;
    if (progress.quizExists) {
      const { data: passedQuizAttempt } = await supabaseAdmin
        .from('quiz_attempts')
        .select('score, total_score, percentage, passed, quizzes(passing_score)')
        .eq('student_id', studentId)
        .eq('passed', true)
        .order('percentage', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (passedQuizAttempt) {
        quizScore = Math.round(Number(passedQuizAttempt.percentage || 100));
        quizPassingScore = Number((passedQuizAttempt.quizzes as any)?.passing_score || 75);
      }
    }

    const formattedDate = completedDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      eligible: true,
      certificateId: stableCertCode,
      certificateCode: stableCertCode,
      serialCode: stableCertCode,
      verificationUrl: `https://edusphere.edu/verify/${stableCertCode}`,
      issueDate: formattedDate,
      completionDate: formattedDate,
      studentId: profile?.id || studentId,
      studentName: profile?.full_name || 'Student',
      studentEmail: profile?.email || '',
      courseId: course?.id || courseId,
      courseTitle: course?.title || 'Course Masterclass',
      courseDescription: course?.short_description || course?.full_description || '',
      courseThumbnail: course?.thumbnail || '',
      durationHours: Number(Number(course?.duration_hours || Math.round((progress.totalLessons * 15) / 60) || 4).toFixed(2)),
      instructorId: instructorProfile?.id || '',
      instructorName: instructorProfile?.full_name || 'EduSphere Lead Instructor',
      instructorTitle: instructorProfile?.headline || instructorProfile?.qualification || 'Lead Instructor & Mentor',
      instructorAvatar: instructorProfile?.avatar_url || '',
      institutionName: 'EduSphere Learning Management System',
      accreditation: 'EduSphere Academic Council & Global Credentialing',
      scoreSummary: {
        lessonsCompleted: progress.completedLessons,
        totalLessons: progress.totalLessons,
        assignmentsPassed: progress.completedAssignmentsCount,
        totalAssignments: progress.mandatoryAssignmentsCount,
        quizScore,
        quizPassingScore,
      },
    };
  }

  /**
   * 8. Fetch All Certificates for Authenticated Student (Earned & In-Progress)
   * Optimized with parallel batched progress calculation (eliminates N+1 DB waterfall)
   */
  public async getAllStudentCertificates(studentId: string): Promise<any[]> {
    // 1. Fetch enrollments, student profile, and all courses progress in parallel
    const [
      { data: enrollments, error },
      { data: profile },
      progressByCourse,
    ] = await Promise.all([
      supabaseAdmin
        .from('enrollments')
        .select(`
          id,
          course_id,
          status,
          enrolled_at,
          completed_at,
          courses(
            id,
            title,
            thumbnail,
            short_description,
            duration_hours,
            instructor_id,
            category_id,
            categories:category_id(name)
          )
        `)
        .eq('student_id', studentId)
        .neq('status', 'Cancelled')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', studentId)
        .maybeSingle(),
      this.getStudentAllCoursesProgress(studentId),
    ]);

    if (error) {
      throw ApiError.internal(`Failed to fetch student enrollments for certificates: ${error.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    const studentName = profile?.full_name || 'Student';

    // 2. Batch-fetch all distinct instructor profiles in 1 single query
    const instructorIds = Array.from(
      new Set(enrollments.map((e: any) => (e.courses as any)?.instructor_id).filter(Boolean))
    );
    const { data: instructors } = instructorIds.length > 0
      ? await supabaseAdmin
          .from('profiles')
          .select('id, full_name, avatar_url, headline, qualification')
          .in('id', instructorIds)
      : { data: [] };
    const instructorMap = new Map<string, any>((instructors || []).map((i) => [i.id, i]));

    // 3. Assemble certificate details in memory instantly without further DB calls
    const certificatesList: any[] = [];

    for (const enr of enrollments) {
      const course = enr.courses as any;
      if (!course) continue;

      const instructorProfile = course.instructor_id ? instructorMap.get(course.instructor_id) : null;
      const progressData = progressByCourse[enr.course_id] || ({} as any);

      const isCompleted = Boolean(progressData.isCourseCompleted || progressData.certificateAvailable);
      const completedDate = enr.completed_at ? new Date(enr.completed_at) : new Date();
      const issueYear = completedDate.getFullYear();
      const stableCertCode = `EDU-${issueYear}-${enr.course_id.slice(0, 4).toUpperCase()}-${enr.id.slice(0, 8).toUpperCase()}`;

      const totalLessons = progressData.totalLessons || 1;
      const completedLessons = progressData.completedLessons || 0;
      const lessonPct = progressData.lessonProgressPercentage || 0;

      const totalAsgs = progressData.mandatoryAssignmentsCount || 0;
      const completedAsgs = progressData.completedAssignmentsCount || 0;
      const asgPct = totalAsgs > 0 ? Math.round((completedAsgs / totalAsgs) * 100) : 100;

      const hasQuiz = progressData.quizExists ?? true;
      const quizPassed = progressData.quizPassed ?? false;
      const quizPct = hasQuiz ? (quizPassed ? 100 : 0) : 100;

      const overallPct = Math.round((lessonPct + asgPct + quizPct) / 3);

      const formattedDate = completedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const dynamicCategory =
        (course.categories as any)?.name ||
        (course as any)?.category_name ||
        (course as any)?.category ||
        'General';

      certificatesList.push({
        id: `cert-${enr.id}`,
        courseId: enr.course_id,
        courseTitle: course.title || 'Course Masterclass',
        courseCategory: dynamicCategory,
        courseThumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
        courseDescription: course.description || '',
        studentId,
        studentName,
        instructorName: instructorProfile?.full_name || 'EduSphere Lead Instructor',
        instructorTitle: instructorProfile?.headline || instructorProfile?.qualification || 'Lead Instructor & Mentor',
        instructorAvatar: instructorProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        issueDate: isCompleted ? formattedDate : undefined,
        completionDate: isCompleted ? formattedDate : undefined,
        certificateCode: stableCertCode,
        verificationUrl: `https://edusphere.edu/verify/${stableCertCode}`,
        downloadUrl: '#',
        status: isCompleted ? 'earned' : lessonPct > 0 ? 'pending' : 'locked',
        learningHours: Number(Number(course.duration_hours || Math.round((totalLessons * 15) / 60) || 4).toFixed(2)),
        requirements: {
          lessonsCompletionPercent: lessonPct,
          assignmentsCompletionPercent: asgPct,
          quizzesPassPercent: quizPct,
          overallProgressPercent: isCompleted ? 100 : overallPct,
          remainingLessonsCount: Math.max(0, totalLessons - completedLessons),
          remainingAssignmentsCount: Math.max(0, totalAsgs - completedAsgs),
          remainingQuizzesCount: hasQuiz && !quizPassed ? 1 : 0,
        },
      });
    }

    return certificatesList;
  }

  /**
   * 8. Calculate Batch Progress for all Enrolled Courses for a Student
   * Executes in batched queries instead of N+1 individual roundtrips
   */
  public async getStudentAllCoursesProgress(
    studentId: string
  ): Promise<Record<string, StudentCourseProgressSummary>> {
    // 1. Fetch all student enrollments
    const { data: enrollments, error: enrErr } = await supabaseAdmin
      .from('enrollments')
      .select('id, course_id, status, enrolled_at')
      .eq('student_id', studentId)
      .neq('status', 'Cancelled');

    if (enrErr || !enrollments || enrollments.length === 0) {
      return {};
    }

    const courseIds = enrollments.map((e) => e.course_id);

    // 2. Fetch in parallel: modules+lessons, completed lesson_progress, published assignments, published quizzes
    const [
      { data: allModules },
      { data: allCompletedLessons },
      { data: allAssignments },
      { data: allQuizzes },
    ] = await Promise.all([
      supabaseAdmin
        .from('course_modules')
        .select('course_id, id, lessons(id)')
        .in('course_id', courseIds),
      supabaseAdmin
        .from('lesson_progress')
        .select('course_id, lesson_id')
        .eq('student_id', studentId)
        .eq('status', 'Completed')
        .in('course_id', courseIds),
      supabaseAdmin
        .from('assignments')
        .select('id, course_id, max_score, passing_score')
        .in('course_id', courseIds)
        .eq('status', 'Published'),
      supabaseAdmin
        .from('quizzes')
        .select('id, course_id, passing_score')
        .in('course_id', courseIds)
        .eq('status', 'Published'),
    ]);

    // 3. Fetch submissions and quiz attempts if applicable
    const assignmentIds = (allAssignments || []).map((a) => a.id);
    const quizIds = (allQuizzes || []).map((q) => q.id);

    const [
      { data: allSubmissions },
      { data: allPassedQuizzes },
    ] = await Promise.all([
      assignmentIds.length > 0
        ? supabaseAdmin
            .from('assignment_submissions')
            .select('assignment_id, status, score')
            .eq('student_id', studentId)
            .in('assignment_id', assignmentIds)
        : Promise.resolve({ data: [] }),
      quizIds.length > 0
        ? supabaseAdmin
            .from('quiz_attempts')
            .select('quiz_id, passed')
            .eq('student_id', studentId)
            .eq('passed', true)
            .in('quiz_id', quizIds)
        : Promise.resolve({ data: [] }),
    ]);

    // 4. Index data by course_id in-memory
    const lessonsByCourse = new Map<string, string[]>();
    (allModules || []).forEach((m: any) => {
      const cId = m.course_id;
      const list = lessonsByCourse.get(cId) || [];
      const lList = (m.lessons as any[]) || [];
      lList.forEach((l) => list.push(l.id));
      lessonsByCourse.set(cId, list);
    });

    const completedLessonsByCourse = new Map<string, Set<string>>();
    (allCompletedLessons || []).forEach((lp: any) => {
      const cId = lp.course_id;
      const set = completedLessonsByCourse.get(cId) || new Set<string>();
      set.add(lp.lesson_id);
      completedLessonsByCourse.set(cId, set);
    });

    const assignmentsByCourse = new Map<string, any[]>();
    (allAssignments || []).forEach((a: any) => {
      const list = assignmentsByCourse.get(a.course_id) || [];
      list.push(a);
      assignmentsByCourse.set(a.course_id, list);
    });

    const submissionsByAsg = new Map<string, any[]>();
    (allSubmissions || []).forEach((s: any) => {
      const list = submissionsByAsg.get(s.assignment_id) || [];
      list.push(s);
      submissionsByAsg.set(s.assignment_id, list);
    });

    const quizzesByCourse = new Map<string, any>();
    (allQuizzes || []).forEach((q: any) => {
      quizzesByCourse.set(q.course_id, q);
    });

    const passedQuizSet = new Set<string>();
    (allPassedQuizzes || []).forEach((pq: any) => {
      if (pq.passed) passedQuizSet.add(pq.quiz_id);
    });

    // 5. Compute exact summary for each enrolled course
    const results: Record<string, StudentCourseProgressSummary> = {};

    for (const enr of enrollments) {
      const courseId = enr.course_id;
      const courseLessonIds = lessonsByCourse.get(courseId) || [];
      const totalLessons = courseLessonIds.length;
      const completedSet = completedLessonsByCourse.get(courseId) || new Set<string>();
      
      let completedLessons = 0;
      courseLessonIds.forEach((lId) => {
        if (completedSet.has(lId)) completedLessons++;
      });

      const lessonProgressPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const courseAssignments = assignmentsByCourse.get(courseId) || [];
      const mandatoryAssignmentsCount = courseAssignments.length;

      let submittedAssignmentsCount = 0;
      let gradedAssignmentsCount = 0;
      let passedAssignmentsCount = 0;

      courseAssignments.forEach((asg) => {
        const asgSubs = submissionsByAsg.get(asg.id) || [];
        if (asgSubs.length > 0) {
          submittedAssignmentsCount++;
          if (asgSubs.some((s) => s.status === 'Graded')) {
            gradedAssignmentsCount++;
          }
          const passingScore = asg.passing_score !== undefined && asg.passing_score !== null ? asg.passing_score : 60;
          if (asgSubs.some((s) => s.status === 'Graded' && s.score !== null && (s.score ?? 0) >= passingScore)) {
            passedAssignmentsCount++;
          }
        }
      });

      const hasLessons = totalLessons > 0;
      const lessonsCompleted = hasLessons && completedLessons >= totalLessons;
      const assignmentsSubmitted = mandatoryAssignmentsCount === 0 || submittedAssignmentsCount >= mandatoryAssignmentsCount;
      const assignmentsGraded = mandatoryAssignmentsCount === 0 || gradedAssignmentsCount >= mandatoryAssignmentsCount;
      const assignmentsComplete = mandatoryAssignmentsCount === 0 || passedAssignmentsCount >= mandatoryAssignmentsCount;

      const quiz = quizzesByCourse.get(courseId);
      const hasMandatoryQuiz = Boolean(quiz);
      const quizPassed = hasMandatoryQuiz ? passedQuizSet.has(quiz.id) : true;

      const isCourseCompleted =
        hasLessons &&
        lessonsCompleted &&
        assignmentsSubmitted &&
        assignmentsGraded &&
        assignmentsComplete &&
        quizPassed;

      const certificateAvailable = isCourseCompleted;

      results[courseId] = {
        courseId,
        studentId,
        totalLessons,
        completedLessons,
        lessonProgressPercentage,
        completedLessonIds: Array.from(completedSet),
        totalAssignments: mandatoryAssignmentsCount,
        completedAssignments: submittedAssignmentsCount,
        mandatoryAssignmentsCount,
        completedAssignmentsCount: submittedAssignmentsCount,
        assignmentsSubmitted,
        assignmentsGraded,
        assignmentsComplete,
        quizExists: hasMandatoryQuiz,
        hasMandatoryQuiz,
        quizPassed,
        courseComplete: isCourseCompleted,
        isCourseCompleted,
        certificateAvailable,
        enrolledAt: enr.enrolled_at || new Date().toISOString(),
        overallProgressPercentage: lessonProgressPercentage,
      };
    }

    return results;
  }
}

export const progressService = new ProgressService();

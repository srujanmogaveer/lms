import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  Enrollment,
  EnrollmentQueryFilters,
  EnrollmentStatus,
  DetailedStudentProgressItem,
  AssignmentSubmissionStatus,
  QuizPerformanceStatus,
  CertificateEligibilityStatus,
} from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class EnrollmentService {
  /**
   * Helper to format DB Enrollment row
   */
  private formatEnrollment(row: any): Enrollment {
    return {
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.courses?.title,
      courseThumbnail: row.courses?.thumbnail,
      instructorId: row.courses?.instructor_id,
      instructorName: row.courses?.profiles?.full_name,
      instructorAvatar: row.courses?.profiles?.avatar_url,
      instructorBio: row.courses?.profiles?.bio,
      instructorSpecialization: row.courses?.profiles?.specialization,
      instructorQualification: row.courses?.profiles?.qualification,
      category: row.courses?.categories?.name || row.courses?.category,
      rating: row.courses?.rating,
      studentsEnrolled: row.courses?.students_enrolled,
      studentId: row.student_id,
      studentName: row.profiles?.full_name,
      studentAvatar: row.profiles?.avatar_url,
      studentEmail: row.profiles?.email,
      status: row.status as EnrollmentStatus,
      enrolledAt: row.enrolled_at,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 1. Get all enrollments for a student
   */
  public async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    const { data: rows, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        student_id,
        course_id,
        status,
        enrolled_at,
        completed_at,
        created_at,
        updated_at,
        courses(
          id,
          title,
          thumbnail,
          instructor_id,
          category_id,
          rating,
          students_enrolled,
          profiles:instructor_id(full_name, avatar_url, bio, specialization, qualification),
          categories:category_id(name)
        )
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student enrollments:', error);
      throw ApiError.internal(`Failed to retrieve enrollments: ${error.message}`);
    }

    return (rows || []).map((row) => this.formatEnrollment(row));
  }

  /**
   * 2. Get single enrollment by student and course
   */
  public async getStudentEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        student_id,
        course_id,
        status,
        enrolled_at,
        completed_at,
        created_at,
        updated_at,
        courses(
          id,
          title,
          thumbnail,
          instructor_id,
          category_id,
          rating,
          students_enrolled,
          profiles:instructor_id(full_name, avatar_url, bio, specialization, qualification),
          categories:category_id(name)
        )
      `)
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching student enrollment:', error);
      throw ApiError.internal(`Failed to retrieve enrollment: ${error.message}`);
    }

    if (!data) return null;
    return this.formatEnrollment(data);
  }

  /**
   * 3. Check if student is actively enrolled
   */
  public async checkStudentEnrollment(studentId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking student enrollment:', error);
      return false;
    }

    return Boolean(data && (data.status === 'Active' || data.status === 'Completed'));
  }

  /**
   * 4. Create enrollment (Student enrollment into Published & Approved course)
   */
  public async createEnrollment(studentId: string, courseId: string): Promise<Enrollment> {
    // 1. Verify student exists and has student role
    const { data: studentProfile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', studentId)
      .maybeSingle();

    if (profErr || !studentProfile) {
      throw ApiError.notFound('Student profile not found');
    }

    // 2. Verify course exists, is Published & Approved
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('id, title, course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (courseErr || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Cannot enroll in a course that is not Published and Approved');
    }

    // 3. Check whether enrollment already exists
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'Active' || existing.status === 'Completed') {
        throw ApiError.badRequest('Student is already enrolled in this course.');
      }
      
      // If previously cancelled, reactivate
      const { data: reactivated, error: reactErr } = await supabaseAdmin
        .from('enrollments')
        .update({
          status: 'Active',
          enrolled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*, courses(*, profiles:instructor_id(full_name))')
        .single();

      if (reactErr || !reactivated) {
        throw ApiError.internal('Failed to reactivate enrollment');
      }

      return this.formatEnrollment(reactivated);
    }

    // 4. Create new enrollment
    const { data: newEnrollment, error: insertErr } = await supabaseAdmin
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'Active',
        enrolled_at: new Date().toISOString(),
      })
      .select('*, courses(*, profiles:instructor_id(full_name))')
      .single();

    if (insertErr || !newEnrollment) {
      logger.error('Error inserting enrollment:', insertErr);
      throw ApiError.internal(insertErr?.message || 'Failed to create enrollment');
    }

    // Increment students enrolled counter on course
    try {
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .select('students_enrolled')
        .eq('id', courseId)
        .single();

      if (courseRow) {
        await supabaseAdmin
          .from('courses')
          .update({ students_enrolled: (courseRow.students_enrolled || 0) + 1 })
          .eq('id', courseId);
      }
    } catch {
      // Non-blocking aggregate sync
    }

    // Dispatch enrollment notifications (asynchronous & non-blocking)
    try {
      // 1. Notify Student
      await NotificationService.createNotification({
        userId: studentId,
        title: `Enrollment Confirmed: ${course.title}`,
        message: `You have successfully enrolled in "${course.title}". Start learning now!`,
        type: 'success',
        category: 'course',
        actionUrl: `/student/courses/${course.id}`,
        sourceId: newEnrollment.id,
      });

      // 2. Notify Instructor
      const instructorId = (newEnrollment.courses as any)?.instructor_id;
      if (instructorId) {
        const studentName = (studentProfile as any)?.full_name || 'A new student';
        await NotificationService.createNotification({
          userId: instructorId,
          title: `New Student Enrolled`,
          message: `${studentName} has enrolled in your course "${course.title}".`,
          type: 'info',
          category: 'course',
          actionUrl: '/instructor/students',
          sourceId: newEnrollment.id,
        });
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch enrollment notifications: ${notifErr.message}`);
    }

    return this.formatEnrollment(newEnrollment);
  }

  /**
   * 5. Cancel student enrollment
   */
  public async cancelEnrollment(studentId: string, courseId: string): Promise<void> {
    const { data: enrollment, error: fetchErr } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (fetchErr || !enrollment) {
      throw ApiError.notFound('Enrollment record not found');
    }

    if (enrollment.student_id !== studentId) {
      throw ApiError.forbidden('Access denied to modify this enrollment');
    }

    const { error: updErr } = await supabaseAdmin
      .from('enrollments')
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    if (updErr) {
      throw ApiError.internal(`Failed to cancel enrollment: ${updErr.message}`);
    }
  }

  /**
   * 6. Complete enrollment
   */
  public async completeEnrollment(studentId: string, courseId: string): Promise<Enrollment> {
    const { data: enrollment, error: fetchErr } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (fetchErr || !enrollment) {
      throw ApiError.notFound('Enrollment not found');
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('enrollments')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id)
      .select('*, courses(*, profiles:instructor_id(full_name))')
      .single();

    if (updErr || !updated) {
      throw ApiError.internal(`Failed to complete enrollment: ${updErr?.message}`);
    }

    return this.formatEnrollment(updated);
  }

  /**
   * 7. Instructor: Get detailed student enrollments and learning progress for own courses
   */
  public async getInstructorEnrollments(
    authUserId: string,
    filters?: EnrollmentQueryFilters
  ): Promise<{
    students: DetailedStudentProgressItem[];
    courses: { id: string; title: string }[];
  }> {
    // 1. Fetch all courses owned by this instructor
    const { data: instructorCoursesList } = await supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('instructor_id', authUserId);

    const courses = (instructorCoursesList || []).map((c) => ({ id: c.id, title: c.title }));
    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return { students: [], courses: [] };
    }

    // 2. Query enrollments for these courses
    let query = supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        course_id,
        student_id,
        status,
        enrolled_at,
        completed_at,
        created_at,
        courses (
          id,
          title,
          lessons_count
        ),
        profiles:student_id (
          id,
          full_name,
          avatar_url,
          email,
          phone,
          updated_at
        )
      `)
      .in('course_id', courseIds)
      .neq('status', 'Cancelled');

    if (filters?.courseId && filters.courseId !== 'All') {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    query = query.order('enrolled_at', { ascending: false });

    const { data: rows, error } = await query;
    if (error) {
      logger.error('Error fetching instructor enrollments:', error);
      throw ApiError.internal(`Failed to retrieve enrollments: ${error.message}`);
    }

    if (!rows || rows.length === 0) {
      return { students: [], courses };
    }

    const studentIds = Array.from(new Set(rows.map((r: any) => r.student_id)));

    // 3. Fetch lessons count and lesson records for all relevant courses
    const { data: modulesData } = await supabaseAdmin
      .from('course_modules')
      .select('course_id, lessons(id, title)')
      .in('course_id', courseIds);

    const courseLessonsMap = new Map<string, { id: string; title: string }[]>();
    const lessonTitleMap = new Map<string, string>();

    for (const mod of modulesData || []) {
      const cId = mod.course_id;
      const currentList = courseLessonsMap.get(cId) || [];
      const lessons = (mod.lessons as any[]) || [];
      for (const l of lessons) {
        currentList.push({ id: l.id, title: l.title });
        lessonTitleMap.set(l.id, l.title);
      }
      courseLessonsMap.set(cId, currentList);
    }

    // 4. Fetch assignments for these courses
    const { data: assignmentsData } = await supabaseAdmin
      .from('assignments')
      .select('id, course_id, title, passing_score')
      .in('course_id', courseIds)
      .eq('status', 'Published');

    const courseAssignmentsMap = new Map<string, any[]>();
    for (const asg of assignmentsData || []) {
      const list = courseAssignmentsMap.get(asg.course_id) || [];
      list.push(asg);
      courseAssignmentsMap.set(asg.course_id, list);
    }

    // 5. Fetch quizzes for these courses
    const { data: quizzesData } = await supabaseAdmin
      .from('quizzes')
      .select('id, course_id, title, passing_score')
      .in('course_id', courseIds)
      .eq('status', 'Published');

    const courseQuizzesMap = new Map<string, any[]>();
    for (const q of quizzesData || []) {
      const list = courseQuizzesMap.get(q.course_id) || [];
      list.push(q);
      courseQuizzesMap.set(q.course_id, list);
    }

    // 6. Fetch lesson_progress for enrolled students
    const { data: progressRows } = await supabaseAdmin
      .from('lesson_progress')
      .select('student_id, course_id, lesson_id, status, last_accessed_at, completed_at, updated_at')
      .in('student_id', studentIds)
      .in('course_id', courseIds);

    const progressMap = new Map<string, any[]>(); // key: `${studentId}_${courseId}`
    for (const p of progressRows || []) {
      const key = `${p.student_id}_${p.course_id}`;
      const list = progressMap.get(key) || [];
      list.push(p);
      progressMap.set(key, list);
    }

    // 7. Fetch assignment_submissions for enrolled students
    const { data: assignmentSubmissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('student_id, assignment_id, status, score, created_at, updated_at')
      .in('student_id', studentIds);

    const asgSubsMap = new Map<string, any[]>(); // key: `${studentId}_${assignmentId}`
    for (const sub of assignmentSubmissions || []) {
      const key = `${sub.student_id}_${sub.assignment_id}`;
      const list = asgSubsMap.get(key) || [];
      list.push(sub);
      asgSubsMap.set(key, list);
    }

    // 8. Fetch quiz_attempts for enrolled students
    const { data: quizAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('student_id, quiz_id, passed, score, percentage, created_at')
      .in('student_id', studentIds);

    const quizAttemptsMap = new Map<string, any[]>(); // key: `${studentId}_${quizId}`
    for (const att of quizAttempts || []) {
      const key = `${att.student_id}_${att.quiz_id}`;
      const list = quizAttemptsMap.get(key) || [];
      list.push(att);
      quizAttemptsMap.set(key, list);
    }

    // Date 30 days ago for activity calculation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 9. Format each student-course enrollment
    const students: DetailedStudentProgressItem[] = rows.map((row: any) => {
      const course = row.courses || {};
      const profile = row.profiles || {};
      const studentId = row.student_id;
      const courseId = row.course_id;

      // Lesson Progress
      const allCourseLessons = courseLessonsMap.get(courseId) || [];
      const totalLessons = allCourseLessons.length || Number(course.lessons_count || 0);
      const studentProgressList = progressMap.get(`${studentId}_${courseId}`) || [];
      const completedLessons = studentProgressList.filter((p) => p.status === 'Completed');
      const lessonsCompletedCount = completedLessons.length;
      const lessonProgressPercentage =
        totalLessons > 0 ? Math.min(100, Math.round((lessonsCompletedCount / totalLessons) * 100)) : 0;

      // Last Lesson Completed
      completedLessons.sort(
        (a, b) =>
          new Date(b.completed_at || b.updated_at || 0).getTime() -
          new Date(a.completed_at || a.updated_at || 0).getTime()
      );
      const lastCompletedLessonId = completedLessons[0]?.lesson_id;
      const lastLessonCompletedTitle = lastCompletedLessonId
        ? lessonTitleMap.get(lastCompletedLessonId) || 'Lesson Completed'
        : 'No lessons completed yet';

      // Assignment Progress
      const courseAssignments = courseAssignmentsMap.get(courseId) || [];
      const totalAssignments = courseAssignments.length;
      let submittedAssignmentsCount = 0;
      let lastAssignmentTitle = 'No assignments submitted yet';

      for (const asg of courseAssignments) {
        const subs = asgSubsMap.get(`${studentId}_${asg.id}`) || [];
        if (subs.length > 0) {
          submittedAssignmentsCount++;
          lastAssignmentTitle = asg.title || 'Assignment Submitted';
        }
      }

      const assignmentProgressPercentage =
        totalAssignments > 0
          ? Math.min(100, Math.round((submittedAssignmentsCount / totalAssignments) * 100))
          : (totalLessons > 0 ? 100 : 0);

      const assignmentStatus: AssignmentSubmissionStatus =
        totalAssignments === 0 || submittedAssignmentsCount >= totalAssignments ? 'Completed' : 'Pending';

      // Quiz Progress
      const courseQuizzes = courseQuizzesMap.get(courseId) || [];
      const totalQuizzes = courseQuizzes.length;
      let quizzesPassedCount = 0;
      let hadAttempts = false;
      let lastQuizTitle = 'No quizzes attempted yet';

      for (const q of courseQuizzes) {
        const attempts = quizAttemptsMap.get(`${studentId}_${q.id}`) || [];
        if (attempts.length > 0) {
          hadAttempts = true;
          const passingScore = q.passing_score !== undefined && q.passing_score !== null ? q.passing_score : 60;
          const passed = attempts.some((att) => att.passed || (att.percentage ?? att.score ?? 0) >= passingScore);
          if (passed) {
            quizzesPassedCount++;
          }
          lastQuizTitle = `${q.title} (${Math.round(attempts[0]?.percentage || attempts[0]?.score || 0)}%)`;
        }
      }

      const quizProgressPercentage =
        totalQuizzes > 0
          ? Math.min(100, Math.round((quizzesPassedCount / totalQuizzes) * 100))
          : (totalLessons > 0 ? 100 : 0);

      let quizStatus: QuizPerformanceStatus = 'Not Attempted';
      if (totalQuizzes === 0 || quizzesPassedCount >= totalQuizzes) {
        quizStatus = 'Passed';
      } else if (hadAttempts) {
        quizStatus = 'Failed';
      }

      // Overall Progress
      let overallProgressPercentage = 0;
      if (totalAssignments > 0 && totalQuizzes > 0) {
        overallProgressPercentage = Math.round(
          lessonProgressPercentage * 0.7 + assignmentProgressPercentage * 0.15 + quizProgressPercentage * 0.15
        );
      } else if (totalAssignments > 0) {
        overallProgressPercentage = Math.round(
          lessonProgressPercentage * 0.8 + assignmentProgressPercentage * 0.2
        );
      } else if (totalQuizzes > 0) {
        overallProgressPercentage = Math.round(
          lessonProgressPercentage * 0.8 + quizProgressPercentage * 0.2
        );
      } else {
        overallProgressPercentage = lessonProgressPercentage;
      }

      // If enrollment status is completed, guarantee 100%
      if (row.status === 'Completed') {
        overallProgressPercentage = 100;
      }

      // Certificate Eligibility
      let certificateStatus: CertificateEligibilityStatus = 'Locked';
      const lockReasons: string[] = [];

      if (lessonsCompletedCount < totalLessons && totalLessons > 0) {
        lockReasons.push(`Lessons Incomplete (${lessonsCompletedCount}/${totalLessons})`);
      }
      if (assignmentStatus !== 'Completed') {
        lockReasons.push(`Assignments Pending (${submittedAssignmentsCount}/${totalAssignments})`);
      }
      if (totalQuizzes > 0 && quizStatus !== 'Passed') {
        lockReasons.push(`Quiz Incomplete or Failed (${quizzesPassedCount}/${totalQuizzes})`);
      }

      if (lockReasons.length === 0 && overallProgressPercentage >= 100) {
        certificateStatus = 'Eligible';
      }

      // Activity & Login
      const enrollmentDateObj = new Date(row.enrolled_at || row.created_at || new Date());
      const enrollmentDateStr = enrollmentDateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Active status and last login/activity calculation
      const allActivityTimestamps: number[] = [enrollmentDateObj.getTime()];
      if (profile.updated_at) {
        const pDate = new Date(profile.updated_at).getTime();
        if (!isNaN(pDate)) allActivityTimestamps.push(pDate);
      }
      for (const p of studentProgressList) {
        if (p.last_accessed_at) allActivityTimestamps.push(new Date(p.last_accessed_at).getTime());
        if (p.completed_at) allActivityTimestamps.push(new Date(p.completed_at).getTime());
        if (p.updated_at) allActivityTimestamps.push(new Date(p.updated_at).getTime());
      }
      for (const asg of courseAssignments) {
        const subs = asgSubsMap.get(`${studentId}_${asg.id}`) || [];
        for (const s of subs) {
          if (s.submitted_at) allActivityTimestamps.push(new Date(s.submitted_at).getTime());
          if (s.created_at) allActivityTimestamps.push(new Date(s.created_at).getTime());
        }
      }
      for (const q of courseQuizzes) {
        const attempts = quizAttemptsMap.get(`${studentId}_${q.id}`) || [];
        for (const a of attempts) {
          if (a.completed_at) allActivityTimestamps.push(new Date(a.completed_at).getTime());
          if (a.created_at) allActivityTimestamps.push(new Date(a.created_at).getTime());
        }
      }

      const validTimestamps = allActivityTimestamps.filter((t) => !isNaN(t) && t > 0);
      const maxActivityTimestamp = new Date(
        validTimestamps.length > 0 ? Math.max(...validTimestamps) : enrollmentDateObj.getTime()
      );

      const isActive = maxActivityTimestamp >= thirtyDaysAgo;
      const lastLoginStr = maxActivityTimestamp.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Student short display ID
      const shortStudentId = `STD-${studentId.substring(0, 6).toUpperCase()}`;

      return {
        id: row.id,
        studentId: shortStudentId,
        studentName: profile.full_name || 'Student',
        studentAvatar: profile.avatar_url || '',
        email: profile.email || '',
        phone: profile.phone || 'Not Provided',
        courseId: courseId,
        courseTitle: course.title || 'Course',
        enrollmentDate: enrollmentDateStr,
        isActive,
        lessonProgressPercentage,
        lessonsCompleted: lessonsCompletedCount,
        totalLessons,
        assignmentProgressPercentage,
        assignmentsCompleted: submittedAssignmentsCount,
        totalAssignments,
        assignmentStatus,
        quizProgressPercentage,
        quizzesPassed: quizzesPassedCount,
        totalQuizzes,
        quizStatus,
        overallProgressPercentage,
        certificateStatus,
        certificateLockReason: lockReasons.length > 0 ? lockReasons.join(' & ') : undefined,
        lastLogin: lastLoginStr,
        lastLessonCompleted: lastLessonCompletedTitle,
        lastAssignmentSubmitted: lastAssignmentTitle,
        lastQuizAttempt: lastQuizTitle,
      };
    });

    return {
      students,
      courses,
    };
  }

  /**
   * 8. Admin: Get all enrollments
   */
  public async getAdminEnrollments(filters?: EnrollmentQueryFilters): Promise<Enrollment[]> {
    let query = supabaseAdmin
      .from('enrollments')
      .select('*, courses(*, profiles:instructor_id(full_name)), profiles:student_id(full_name, avatar_url, email)');

    if (filters?.courseId && filters.courseId !== 'All') {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    query = query.order('enrolled_at', { ascending: false });

    const { data: rows, error } = await query;
    if (error) {
      logger.error('Error fetching admin enrollments:', error);
      throw ApiError.internal(`Failed to retrieve enrollments: ${error.message}`);
    }

    return (rows || []).map((row) => this.formatEnrollment(row));
  }
}

export const enrollmentService = new EnrollmentService();

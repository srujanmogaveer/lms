import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  SubmitQuizAttemptDto,
} from '../types';
import { courseService } from './course.service';
import { progressService } from './progress.service';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

export class QuizService {
  /**
   * Helper to format DB Quiz row to Quiz interface
   */
  private formatQuiz(row: any, questions?: QuizQuestion[]): Quiz {
    return {
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.courses?.title,
      moduleId: row.module_id,
      moduleTitle: row.course_modules?.title,
      lessonId: row.lesson_id,
      lessonTitle: row.lessons?.title,
      title: row.title,
      description: row.description,
      instructions: row.instructions,
      timeLimitMinutes: row.time_limit_minutes,
      passingScore: Number(row.passing_score),
      quizType: row.quiz_type || 'Mandatory',
      maxAttempts: row.max_attempts || 3,
      randomizeQuestions: row.randomize_questions ?? true,
      shuffleOptions: row.shuffle_options ?? true,
      status: row.status || 'Draft',
      position: row.position || 1,
      questionsCount: row.quiz_questions?.[0]?.count ?? (questions ? questions.length : 0),
      questions: questions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper to format QuizQuestion row
   */
  private formatQuestion(row: any): QuizQuestion {
    return {
      id: row.id,
      quizId: row.quiz_id,
      questionText: row.question_text,
      questionType: row.question_type,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options || [],
      correctAnswer: row.correct_answer,
      points: Number(row.points),
      explanation: row.explanation,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper to format QuizAttempt row
   */
  private formatAttempt(row: any, answers?: QuizAnswer[]): QuizAttempt {
    return {
      id: row.id,
      quizId: row.quiz_id,
      quizTitle: row.quizzes?.title,
      studentId: row.student_id,
      studentName: row.profiles?.full_name,
      studentAvatar: row.profiles?.avatar_url,
      startedAt: row.started_at,
      submittedAt: row.submitted_at,
      score: Number(row.score),
      totalScore: Number(row.total_score),
      percentage: Number(row.percentage),
      passed: row.passed,
      status: row.status,
      answers: answers,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // =============================================================
  // INSTRUCTOR QUIZ APIS
  // =============================================================

  public async verifyQuizCourseOwnership(
    authUserId: string,
    courseId: string,
    mustBeMutable = false
  ): Promise<any> {
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id, course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !course) {
      throw ApiError.notFound('Course not found');
    }

    const { data: admin } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (course.instructor_id !== authUserId && !admin) {
      throw ApiError.forbidden('Forbidden: You can only manage quizzes for your own courses');
    }

    if (
      mustBeMutable &&
      !admin &&
      (course.course_status === 'Published' || course.approval_status === 'Pending Approval')
    ) {
      throw ApiError.forbidden(
        course.approval_status === 'Pending Approval'
          ? 'Quizzes and questions are locked while under Admin Review.'
          : 'Quizzes and questions are locked for published courses to protect active student scores and certificates.'
      );
    }

    return course;
  }

  public async getInstructorCourseQuizzes(authUserId: string, courseId: string): Promise<Quiz[]> {
    await this.verifyQuizCourseOwnership(authUserId, courseId, false);

    const { data: rows, error } = await supabaseAdmin
      .from('quizzes')
      .select('*, courses(title), course_modules(title), lessons(title), quiz_questions(count)')
      .eq('course_id', courseId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw ApiError.internal(`Failed to fetch course quizzes: ${error.message}`);
    }

    const quizzes: Quiz[] = [];
    for (const row of rows || []) {
      const { data: questions } = await supabaseAdmin
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', row.id)
        .order('position', { ascending: true });

      const formattedQuestions = (questions || []).map((q) => this.formatQuestion(q));
      quizzes.push(this.formatQuiz(row, formattedQuestions));
    }

    return quizzes;
  }

  public async getQuizById(authUserId: string, quizId: string, role?: string): Promise<Quiz> {
    const { data: row, error } = await supabaseAdmin
      .from('quizzes')
      .select('*, courses(title, instructor_id), course_modules(title), lessons(title)')
      .eq('id', quizId)
      .single();

    if (error || !row) throw ApiError.notFound('Quiz not found');

    const isInstructor = role === 'Instructor' || role === 'instructor';
    const isAdmin = role === 'Admin' || role === 'admin';

    if (isInstructor) {
      await this.verifyQuizCourseOwnership(authUserId, row.course_id, false);
    } else if (!isAdmin) {
      // Verify student enrollment before accessing quiz
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('course_id', row.course_id)
        .eq('student_id', authUserId)
        .maybeSingle();

      if (!enrollment) {
        throw ApiError.forbidden('You must be enrolled in this course to access its quiz');
      }

      // Safe questions without correct_answer or isCorrect keys for students before taking
      const { data: questions } = await supabaseAdmin
        .from('quiz_questions')
        .select('id, quiz_id, question_text, question_type, options, points, position, created_at, updated_at')
        .eq('quiz_id', quizId)
        .order('position', { ascending: true });

      const safeQuestions: QuizQuestion[] = (questions || []).map((q: any) => {
        let opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
        opts = opts.map((opt: any) => ({ id: opt.id, text: opt.text }));
        return {
          id: q.id,
          quizId: q.quiz_id,
          questionText: q.question_text,
          questionType: q.question_type,
          options: opts,
          points: Number(q.points),
          position: q.position,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        };
      });

      return this.formatQuiz(row, safeQuestions);
    }

    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });

    const formattedQuestions = (questions || []).map((q) => this.formatQuestion(q));
    return this.formatQuiz(row, formattedQuestions);
  }


  public async createQuiz(authUserId: string, courseId: string, dto: CreateQuizDto): Promise<Quiz> {
    await this.verifyQuizCourseOwnership(authUserId, courseId, true);

    if (dto.moduleId) {
      const { data: mod } = await supabaseAdmin
        .from('course_modules')
        .select('id, course_id')
        .eq('id', dto.moduleId)
        .single();
      if (!mod || mod.course_id !== courseId) {
        throw ApiError.badRequest('Selected module does not belong to this course');
      }
    }

    if (dto.lessonId) {
      const { data: les } = await supabaseAdmin
        .from('lessons')
        .select('id, module_id, course_modules(course_id)')
        .eq('id', dto.lessonId)
        .single();
      if (!les || (les.course_modules as any)?.course_id !== courseId) {
        throw ApiError.badRequest('Selected lesson does not belong to this course');
      }
    }

    let position = dto.position;
    if (position === undefined) {
      const { data: lastQuiz } = await supabaseAdmin
        .from('quizzes')
        .select('position')
        .eq('course_id', courseId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();
      position = (lastQuiz?.position || 0) + 1;
    }

    const { data: newQuiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        course_id: courseId,
        module_id: dto.moduleId || null,
        lesson_id: dto.lessonId || null,
        title: dto.title.trim(),
        description: dto.description || null,
        instructions: dto.instructions || null,
        time_limit_minutes: dto.timeLimitMinutes ?? 15,
        passing_score: dto.passingScore ?? 70.0,
        quiz_type: dto.quizType || 'Mandatory',
        max_attempts: dto.maxAttempts ?? 3,
        randomize_questions: dto.randomizeQuestions ?? true,
        shuffle_options: dto.shuffleOptions ?? true,
        status: dto.status || 'Draft',
        position: position,
      })
      .select('*, courses(title), course_modules(title), lessons(title)')
      .single();

    if (error || !newQuiz) {
      throw ApiError.internal(`Failed to create quiz: ${error?.message}`);
    }

    return this.formatQuiz(newQuiz, []);
  }

  public async updateQuiz(authUserId: string, quizId: string, dto: UpdateQuizDto): Promise<Quiz> {
    const existing = await this.getQuizById(authUserId, quizId, 'Instructor');
    await this.verifyQuizCourseOwnership(authUserId, existing.courseId, true);

    if (dto.moduleId) {
      const { data: mod } = await supabaseAdmin
        .from('course_modules')
        .select('id, course_id')
        .eq('id', dto.moduleId)
        .single();
      if (!mod || mod.course_id !== existing.courseId) {
        throw ApiError.badRequest('Selected module does not belong to this course');
      }
    }

    if (dto.lessonId) {
      const { data: les } = await supabaseAdmin
        .from('lessons')
        .select('id, module_id, course_modules(course_id)')
        .eq('id', dto.lessonId)
        .single();
      if (!les || (les.course_modules as any)?.course_id !== existing.courseId) {
        throw ApiError.badRequest('Selected lesson does not belong to this course');
      }
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (dto.title !== undefined) updatePayload.title = dto.title.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.instructions !== undefined) updatePayload.instructions = dto.instructions;
    if (dto.moduleId !== undefined) updatePayload.module_id = dto.moduleId || null;
    if (dto.lessonId !== undefined) updatePayload.lesson_id = dto.lessonId || null;
    if (dto.timeLimitMinutes !== undefined) updatePayload.time_limit_minutes = dto.timeLimitMinutes;
    if (dto.passingScore !== undefined) updatePayload.passing_score = dto.passingScore;
    if (dto.quizType !== undefined) updatePayload.quiz_type = dto.quizType;
    if (dto.maxAttempts !== undefined) updatePayload.max_attempts = dto.maxAttempts;
    if (dto.randomizeQuestions !== undefined) updatePayload.randomize_questions = dto.randomizeQuestions;
    if (dto.shuffleOptions !== undefined) updatePayload.shuffle_options = dto.shuffleOptions;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.position !== undefined) updatePayload.position = dto.position;

    const { data: updated, error } = await supabaseAdmin
      .from('quizzes')
      .update(updatePayload)
      .eq('id', quizId)
      .select('*, courses(title), course_modules(title), lessons(title)')
      .single();

    if (error || !updated) {
      throw ApiError.internal(`Failed to update quiz: ${error?.message}`);
    }

    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });

    const formattedQuestions = (questions || []).map((q) => this.formatQuestion(q));
    return this.formatQuiz(updated, formattedQuestions);
  }

  public async deleteQuiz(authUserId: string, quizId: string): Promise<void> {
    const existing = await this.getQuizById(authUserId, quizId, 'Instructor');
    await this.verifyQuizCourseOwnership(authUserId, existing.courseId, true);

    const { error } = await supabaseAdmin.from('quizzes').delete().eq('id', quizId);
    if (error) {
      throw ApiError.internal(`Failed to delete quiz: ${error.message}`);
    }
  }

  public async reorderQuizzes(
    authUserId: string,
    courseId: string,
    items: { id: string; position: number }[]
  ): Promise<void> {
    await this.verifyQuizCourseOwnership(authUserId, courseId, true);

    for (const item of items) {
      await supabaseAdmin
        .from('quizzes')
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('course_id', courseId);
    }
  }

  public async publishQuiz(authUserId: string, quizId: string): Promise<Quiz> {
    return this.updateQuiz(authUserId, quizId, { status: 'Published' });
  }

  public async archiveQuiz(authUserId: string, quizId: string): Promise<Quiz> {
    return this.updateQuiz(authUserId, quizId, { status: 'Archived' });
  }

  // =============================================================
  // INSTRUCTOR QUESTIONS APIS
  // =============================================================

  public async getQuizQuestions(authUserId: string, quizId: string): Promise<QuizQuestion[]> {
    const quiz = await this.getQuizById(authUserId, quizId, 'Instructor');

    const { data: questions, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('position', { ascending: true });

    if (error) {
      throw ApiError.internal(`Failed to fetch quiz questions: ${error.message}`);
    }

    return (questions || []).map((q) => this.formatQuestion(q));
  }

  /**
   * Helper to strictly validate question options and correct answer
   */
  private validateQuestionData(type: string, options: any[], correctAnswer: any, points?: number) {
    if (points !== undefined && points <= 0) {
      throw ApiError.badRequest('Points must be greater than 0');
    }

    if (type === 'Single Answer') {
      if (!Array.isArray(options) || options.length < 2) {
        throw ApiError.badRequest('Single Answer questions require at least 2 options');
      }
      const correctOpt = options.filter((o) => o.isCorrect);
      if (correctOpt.length !== 1 && !correctAnswer) {
        throw ApiError.badRequest('Single Answer questions require exactly 1 correct answer');
      }
    } else if (type === 'Multiple Answer') {
      if (!Array.isArray(options) || options.length < 2) {
        throw ApiError.badRequest('Multiple Answer questions require at least 2 options');
      }
      const correctOpts = options.filter((o) => o.isCorrect);
      if (correctOpts.length < 1 && (!Array.isArray(correctAnswer) || correctAnswer.length < 1)) {
        throw ApiError.badRequest('Multiple Answer questions require at least 1 correct answer');
      }
    } else if (type === 'True or False') {
      if (!Array.isArray(options) || options.length === 0) {
        options = [
          { id: 'opt-true', text: 'True', isCorrect: correctAnswer === 'True' || correctAnswer === 'opt-true' },
          { id: 'opt-false', text: 'False', isCorrect: correctAnswer === 'False' || correctAnswer === 'opt-false' },
        ];
      }
      const correctOpt = options.filter((o) => o.isCorrect);
      if (correctOpt.length !== 1 && !correctAnswer) {
        throw ApiError.badRequest('True or False questions require exactly 1 correct answer');
      }
    } else if (type === 'Fill in the Blanks') {
      if (correctAnswer === undefined || correctAnswer === null || String(correctAnswer).trim() === '') {
        throw ApiError.badRequest('Fill in the Blanks questions require a correct answer');
      }
    }
  }

  public async createQuestion(
    authUserId: string,
    quizId: string,
    dto: CreateQuestionDto
  ): Promise<QuizQuestion> {
    const quiz = await this.getQuizById(authUserId, quizId, 'Instructor');
    await this.verifyQuizCourseOwnership(authUserId, quiz.courseId, true);

    this.validateQuestionData(dto.questionType, dto.options, dto.correctAnswer, dto.points);

    let position = dto.position;
    if (position === undefined) {
      const { data: lastQ } = await supabaseAdmin
        .from('quiz_questions')
        .select('position')
        .eq('quiz_id', quizId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();
      position = (lastQ?.position || 0) + 1;
    }

    const { data: newQ, error } = await supabaseAdmin
      .from('quiz_questions')
      .insert({
        quiz_id: quizId,
        question_text: dto.questionText.trim(),
        question_type: dto.questionType,
        options: dto.options || [],
        correct_answer: dto.correctAnswer || null,
        points: dto.points ?? 10.0,
        explanation: dto.explanation || null,
        position: position,
      })
      .select('*')
      .single();

    if (error || !newQ) {
      throw ApiError.internal(`Failed to create question: ${error?.message}`);
    }

    return this.formatQuestion(newQ);
  }

  public async updateQuestion(
    authUserId: string,
    questionId: string,
    dto: UpdateQuestionDto
  ): Promise<QuizQuestion> {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('quiz_questions')
      .select('*, quizzes(course_id)')
      .eq('id', questionId)
      .single();

    if (fetchErr || !existing) throw ApiError.notFound('Question not found');

    await this.verifyQuizCourseOwnership(authUserId, (existing.quizzes as any)?.course_id, true);

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (dto.questionText !== undefined) updatePayload.question_text = dto.questionText.trim();
    if (dto.questionType !== undefined) updatePayload.question_type = dto.questionType;
    if (dto.options !== undefined) updatePayload.options = dto.options;
    if (dto.correctAnswer !== undefined) updatePayload.correct_answer = dto.correctAnswer;
    if (dto.points !== undefined) updatePayload.points = dto.points;
    if (dto.explanation !== undefined) updatePayload.explanation = dto.explanation;
    if (dto.position !== undefined) updatePayload.position = dto.position;

    const { data: updated, error } = await supabaseAdmin
      .from('quiz_questions')
      .update(updatePayload)
      .eq('id', questionId)
      .select('*')
      .single();

    if (error || !updated) {
      throw ApiError.internal(`Failed to update question: ${error?.message}`);
    }

    return this.formatQuestion(updated);
  }

  public async deleteQuestion(authUserId: string, questionId: string): Promise<void> {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('quiz_questions')
      .select('*, quizzes(course_id)')
      .eq('id', questionId)
      .single();

    if (fetchErr || !existing) throw ApiError.notFound('Question not found');

    await this.verifyQuizCourseOwnership(authUserId, (existing.quizzes as any)?.course_id, true);

    const { error } = await supabaseAdmin.from('quiz_questions').delete().eq('id', questionId);
    if (error) {
      throw ApiError.internal(`Failed to delete question: ${error.message}`);
    }
  }

  public async reorderQuestions(
    authUserId: string,
    quizId: string,
    items: { id: string; position: number }[]
  ): Promise<void> {
    const quiz = await this.getQuizById(authUserId, quizId, 'Instructor');
    await this.verifyQuizCourseOwnership(authUserId, quiz.courseId, true);

    for (const item of items) {
      await supabaseAdmin
        .from('quiz_questions')
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('quiz_id', quizId);
    }
  }


  // =============================================================
  // STUDENT QUIZ & ATTEMPTS APIS
  // =============================================================

  public async getPublicCourseQuizzes(courseId: string): Promise<Quiz[]> {
    const { data: rows, error } = await supabaseAdmin
      .from('quizzes')
      .select('*, courses(title), course_modules(title), lessons(title), quiz_questions(count)')
      .eq('course_id', courseId)
      .eq('status', 'Published')
      .order('position', { ascending: true });

    if (error) {
      throw ApiError.internal(`Failed to fetch public course quizzes: ${error.message}`);
    }

    return (rows || []).map((row) => this.formatQuiz(row));
  }

  /**
   * Student Quiz Access: GET /api/v1/courses/:courseId/quiz
   * Verifies enrollment, course status, approval status, and strips correct_answer from all questions.
   */
  public async getStudentCourseQuiz(studentId: string, courseId: string): Promise<Quiz[]> {
    // 1. Verify Course is Published and Approved
    const { data: course, error: cErr } = await supabaseAdmin
      .from('courses')
      .select('id, title, course_status, approval_status')
      .eq('id', courseId)
      .single();

    if (cErr || !course) throw ApiError.notFound('Course not found');
    if (course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Course is not available for student quiz access');
    }

    // 2. Verify Student Enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!enrollment) {
      throw ApiError.forbidden('You must be enrolled in this course to access its quizzes');
    }

    // 3. Fetch Published Quizzes
    const { data: quizzes, error: qErr } = await supabaseAdmin
      .from('quizzes')
      .select('*, courses(title), course_modules(title), lessons(title)')
      .eq('course_id', courseId)
      .eq('status', 'Published')
      .order('position', { ascending: true });

    if (qErr) {
      throw ApiError.internal(`Failed to fetch course quizzes: ${qErr.message}`);
    }

    const result: Quiz[] = [];
    for (const q of quizzes || []) {
      // Fetch questions without exposing correct_answer
      const { data: questions } = await supabaseAdmin
        .from('quiz_questions')
        .select('id, quiz_id, question_text, question_type, options, points, position, created_at, updated_at')
        .eq('quiz_id', q.id)
        .order('position', { ascending: true });

      const safeQuestions: QuizQuestion[] = (questions || []).map((row: any) => {
        let opts = typeof row.options === 'string' ? JSON.parse(row.options) : row.options || [];
        // Strip isCorrect from options for student safety before submission
        opts = opts.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
        }));

        return {
          id: row.id,
          quizId: row.quiz_id,
          questionText: row.question_text,
          questionType: row.question_type,
          options: opts,
          points: Number(row.points),
          position: row.position,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });

      result.push(this.formatQuiz(q, safeQuestions));
    }

    return result;
  }

  public async startQuizAttempt(studentId: string, quizId: string): Promise<QuizAttempt> {
    const { data: quiz, error: qErr } = await supabaseAdmin
      .from('quizzes')
      .select('*, courses(*)')
      .eq('id', quizId)
      .single();

    if (qErr || !quiz) throw ApiError.notFound('Quiz not found');

    if (quiz.status !== 'Published') {
      throw ApiError.forbidden('Quiz is not open for attempts');
    }

    const course = quiz.courses as any;
    if (course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Quiz is not accessible as the course is not published and approved');
    }

    // Verify student enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', quiz.course_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!enrollment) {
      throw ApiError.forbidden('You must be enrolled in this course to attempt its quizzes');
    }

    // Verify Mandatory Assignments Prerequisite: ALL mandatory assignments in course must have at least one passed attempt
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, title, passing_score')
      .eq('course_id', quiz.course_id)
      .eq('status', 'Published');

    const assignmentsList = assignments || [];
    if (assignmentsList.length > 0) {
      const asgIds = assignmentsList.map((a) => a.id);
      const { data: submissions } = await supabaseAdmin
        .from('assignment_submissions')
        .select('assignment_id, status, score')
        .in('assignment_id', asgIds)
        .eq('student_id', studentId);

      const subList = submissions || [];
      for (const asg of assignmentsList) {
        const asgSubs = subList.filter((s) => s.assignment_id === asg.id);
        const passingScore = asg.passing_score !== undefined && asg.passing_score !== null ? Number(asg.passing_score) : 60;
        const hasPassed = asgSubs.some(
          (s) => s.status === 'Graded' && s.score !== null && Number(s.score) >= passingScore
        );
        if (!hasPassed) {
          throw ApiError.forbidden(
            `You must complete and pass all required course assignments before attempting this quiz. Assignment "${asg.title}" has not been passed.`
          );
        }
      }
    }

    // Check for existing active in_progress attempt (allow resuming without error)
    const { data: existingActive } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*, quizzes(title), profiles(full_name, avatar_url)')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (existingActive) {
      return this.formatAttempt(existingActive, []);
    }

    // Check count of completed attempts
    const { count: completedCount } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .eq('status', 'completed');

    const totalAllowed = Number(quiz.max_attempts) || 3;
    
    // Check approved reattempt requests (each approved request grants 1 additional attempt)
    const { count: approvedReattempts } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .eq('status', 'Approved');

    const effectiveMax = totalAllowed + (approvedReattempts || 0);

    if (completedCount !== null && completedCount >= effectiveMax) {
      throw ApiError.forbidden(`Maximum attempts limit reached for this quiz. You can request a reattempt.`);
    }

    // Create attempt
    const { data: attempt, error: aErr } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        status: 'in_progress',
        score: 0,
        total_score: 0,
        percentage: 0,
        passed: false,
      })
      .select('*, quizzes(title), profiles(full_name, avatar_url)')
      .single();

    if (aErr || !attempt) {
      throw ApiError.internal(`Failed to start quiz attempt: ${aErr?.message}`);
    }

    return this.formatAttempt(attempt, []);
  }

  public async submitQuizAttempt(
    studentId: string,
    attemptId: string,
    dto: SubmitQuizAttemptDto
  ): Promise<QuizAttempt> {
    const { data: attempt, error: aErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .single();

    if (aErr || !attempt) throw ApiError.notFound('Attempt not found');
    if (attempt.student_id !== studentId) {
      throw ApiError.forbidden('You can only submit your own quiz attempts');
    }
    if (attempt.status !== 'in_progress') {
      throw ApiError.badRequest('Attempt has already been submitted or completed');
    }

    const quiz = attempt.quizzes;
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', attempt.quiz_id);

    const questionsList = questions || [];
    let calculatedScore = 0;
    let totalScore = 0;

    const answerInserts: any[] = [];

    for (const q of questionsList) {
      const qPoints = Number(q.points) || 10;
      totalScore += qPoints;

      const studentAns = dto.answers.find((a) => a.questionId === q.id)?.answer;
      let isCorrect = false;

      // Evaluation
      if (q.question_type === 'Single Answer' || q.question_type === 'True or False') {
        const correctOpt = (q.options || []).find((opt: any) => opt.isCorrect);
        if (correctOpt && (studentAns === correctOpt.id || studentAns === correctOpt.text)) {
          isCorrect = true;
        } else if (q.correct_answer && studentAns === q.correct_answer) {
          isCorrect = true;
        }
      } else if (q.question_type === 'Multiple Answer') {
        const correctOpts = (q.options || []).filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id);
        if (Array.isArray(studentAns)) {
          const matched =
            studentAns.length === correctOpts.length &&
            studentAns.every((val: any) => correctOpts.includes(val));
          if (matched) isCorrect = true;
        }
      } else if (q.question_type === 'Fill in the Blanks') {
        const expected = String(q.correct_answer || '').trim().toLowerCase();
        const actual = String(studentAns || '').trim().toLowerCase();
        if (expected && actual === expected) {
          isCorrect = true;
        }
      }

      const pointsAwarded = isCorrect ? qPoints : 0;
      calculatedScore += pointsAwarded;

      answerInserts.push({
        attempt_id: attemptId,
        question_id: q.id,
        answer: studentAns !== undefined ? studentAns : null,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      });
    }

    const percentage = totalScore > 0 ? (calculatedScore / totalScore) * 100 : 0;
    const passed = percentage >= Number(quiz.passing_score);

    // Insert answers
    if (answerInserts.length > 0) {
      await supabaseAdmin.from('quiz_answers').insert(answerInserts);
    }

    // Update attempt
    const { error } = await supabaseAdmin
      .from('quiz_attempts')
      .update({
        score: calculatedScore,
        total_score: totalScore,
        percentage,
        passed,
        status: 'completed',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    if (error) {
      throw ApiError.internal(`Failed to update quiz attempt: ${error?.message}`);
    }

    // Automatically recalculate course progress & check completion conditions
    try {
      await progressService.getCourseProgress(studentId, quiz.course_id);
    } catch (progErr: any) {
      console.error('Failed to update course progress after quiz submission:', progErr);
    }

    return this.getAttemptResult(studentId, attemptId);
  }

  public async getAttemptResult(studentId: string, attemptId: string): Promise<QuizAttempt> {
    const { data: attempt, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*, quizzes(title, course_id), profiles(full_name, avatar_url)')
      .eq('id', attemptId)
      .single();

    if (error || !attempt) throw ApiError.notFound('Quiz attempt not found');
    if (attempt.student_id !== studentId) {
      throw ApiError.forbidden('Access denied to attempt results');
    }

    const { data: answers } = await supabaseAdmin
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    // Fetch quiz questions to resolve true correctOptionId and correctAnswer for completed attempt review
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, options, correct_answer, question_type')
      .eq('quiz_id', attempt.quiz_id);

    const questionsMap = new Map<string, any>();
    (questions || []).forEach((q: any) => {
      let opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
      const correctOpt = opts.find((opt: any) => opt.isCorrect);
      questionsMap.set(q.id, {
        correctOptionId: correctOpt?.id || (typeof q.correct_answer === 'string' ? q.correct_answer : ''),
        correctAnswer: q.correct_answer || correctOpt?.text,
      });
    });

    const formattedAnswers: QuizAnswer[] = (answers || []).map((a) => {
      const qMeta = questionsMap.get(a.question_id);
      return {
        id: a.id,
        attemptId: a.attempt_id,
        questionId: a.question_id,
        answer: a.answer,
        isCorrect: a.is_correct,
        pointsAwarded: Number(a.points_awarded),
        correctOptionId: qMeta?.correctOptionId,
        correctAnswer: qMeta?.correctAnswer,
        createdAt: a.created_at,
      };
    });

    return this.formatAttempt(attempt, formattedAnswers);
  }

  // =============================================================
  // REATTEMPT REQUESTS
  // =============================================================

  public async requestReattempt(studentId: string, quizId: string, reason: string): Promise<any> {
    const { data: quiz, error: qErr } = await supabaseAdmin
      .from('quizzes')
      .select('id, course_id, status, max_attempts')
      .eq('id', quizId)
      .single();

    if (qErr || !quiz) throw ApiError.notFound('Quiz not found');

    // Verify student enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', quiz.course_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!enrollment) {
      throw ApiError.forbidden('You must be enrolled in this course to request a quiz reattempt');
    }

    // Verify student has actually exhausted all attempts (base + approved extra attempts)
    const { count: completedCount } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .eq('status', 'completed');

    const totalAllowed = Number(quiz.max_attempts) || 3;

    const { count: approvedReattempts } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .eq('status', 'Approved');

    const effectiveMax = totalAllowed + (approvedReattempts || 0);

    if (completedCount !== null && completedCount < effectiveMax) {
      throw ApiError.badRequest('You still have quiz attempts remaining');
    }

    // Check if an existing active or rejected request exists
    const { data: latestExisting } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('id, status')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestExisting?.status === 'Pending') {
      throw ApiError.badRequest('An additional attempt request is already pending.');
    }

    if (latestExisting?.status === 'Rejected') {
      throw ApiError.badRequest('Your request for an additional attempt was rejected by the instructor. You cannot submit another request.');
    }

    const { data: newRequest, error: insErr } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        reason: (reason || 'Requesting additional attempt after exhausting configured attempts.').trim(),
        status: 'Pending',
      })
      .select('*, quizzes(title), profiles:student_id(full_name, email)')
      .single();

    if (insErr || !newRequest) {
      throw ApiError.internal(`Failed to submit reattempt request: ${insErr?.message}`);
    }

    // Dispatch notification to course instructor (asynchronous & non-blocking)
    try {
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .select('instructor_id')
        .eq('id', quiz.course_id)
        .maybeSingle();

      if (courseRow?.instructor_id) {
        const studentName = (newRequest.profiles as any)?.full_name || 'A student';
        const quizTitle = (newRequest.quizzes as any)?.title || 'Quiz';
        await NotificationService.createNotification({
          userId: courseRow.instructor_id,
          title: `Quiz Reattempt Request: ${quizTitle}`,
          message: `${studentName} requested an additional attempt for "${quizTitle}". Reason: "${reason || 'Extra attempt requested'}"`,
          type: 'info',
          category: 'quiz',
          actionUrl: '/instructor/quizzes',
          sourceId: newRequest.id,
        });
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch quiz reattempt notification: ${notifErr.message}`);
    }

    return newRequest;
  }

  public async getStudentReattemptRequests(studentId: string): Promise<any[]> {
    const { data: rows, error } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('*, quizzes(id, title, course_id, courses(title))')
      .eq('student_id', studentId)
      .order('requested_at', { ascending: false });

    if (error) {
      throw ApiError.internal(`Failed to fetch student reattempt requests: ${error.message}`);
    }

    return rows || [];
  }

  public async getInstructorReattemptRequests(authUserId: string, courseId?: string): Promise<any[]> {
    const query = supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('*, quizzes(id, title, course_id, max_attempts, courses(id, title, instructor_id)), profiles:student_id(id, full_name, avatar_url, email)')
      .order('requested_at', { ascending: false });

    const { data: rows, error } = await query;
    if (error) {
      throw ApiError.internal(`Failed to fetch reattempt requests: ${error.message}`);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUserId)
      .single();

    const isAdmin = profile?.role === 'admin';

    const filtered = (rows || []).filter((r: any) => {
      const isInstructorCourse = isAdmin || r.quizzes?.courses?.instructor_id === authUserId;
      const matchesCourse = !courseId || r.quizzes?.course_id === courseId;
      return isInstructorCourse && matchesCourse;
    });

    const requestsWithCounts = await Promise.all(
      filtered.map(async (r: any) => {
        const { count: completedCount } = await supabaseAdmin
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', r.quiz_id)
          .eq('student_id', r.student_id)
          .eq('status', 'completed');

        return {
          id: r.id,
          quizId: r.quiz_id,
          quizTitle: r.quizzes?.title || 'Quiz',
          studentId: r.student_id,
          studentName: r.profiles?.full_name || 'Student',
          studentEmail: r.profiles?.email || '',
          studentAvatar: r.profiles?.avatar_url || '',
          courseId: r.quizzes?.course_id,
          courseTitle: r.quizzes?.courses?.title || 'Course',
          reason: r.reason,
          status: (r.status || 'Pending').toLowerCase(),
          rawStatus: r.status,
          instructorFeedback: r.instructor_feedback,
          attemptsUsed: completedCount || 0,
          maxAttempts: Number(r.quizzes?.max_attempts) || 3,
          requestedAt: r.requested_at,
          reviewedAt: r.reviewed_at,
          reviewedBy: r.reviewed_by,
          requestDate: new Date(r.requested_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        };
      })
    );

    return requestsWithCounts;
  }

  public async approveReattemptRequest(authUserId: string, requestId: string): Promise<any> {
    return this.reviewReattemptRequest(authUserId, requestId, 'Approved');
  }

  public async rejectReattemptRequest(authUserId: string, requestId: string, feedback?: string): Promise<any> {
    return this.reviewReattemptRequest(authUserId, requestId, 'Rejected', feedback);
  }

  public async reviewReattemptRequest(
    authUserId: string,
    requestId: string,
    status: 'Approved' | 'Rejected',
    feedback?: string
  ): Promise<any> {
    const { data: reqItem, error: fetchErr } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('*, quizzes(course_id)')
      .eq('id', requestId)
      .single();

    if (fetchErr || !reqItem) throw ApiError.notFound('Reattempt request not found');

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUserId)
      .single();

    if (profile?.role !== 'admin') {
      await courseService.verifyCourseOwnership(authUserId, (reqItem.quizzes as any)?.course_id);
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .update({
        status,
        reviewed_by: authUserId,
        instructor_feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select('*, quizzes(title), profiles:student_id(full_name)')
      .single();

    if (updErr || !updated) {
      throw ApiError.internal(`Failed to review reattempt request: ${updErr?.message}`);
    }

    // Dispatch notification to requesting student (asynchronous & non-blocking)
    try {
      const quizTitle = (updated.quizzes as any)?.title || 'Quiz';
      await NotificationService.createNotification({
        userId: updated.student_id,
        title: `Quiz Reattempt ${status === 'Approved' ? 'Approved' : 'Rejected'}`,
        message: `Your request for an additional attempt on "${quizTitle}" was ${status.toLowerCase()}.${feedback ? ` Feedback: "${feedback}"` : ''}`,
        type: status === 'Approved' ? 'success' : 'warning',
        category: 'quiz',
        actionUrl: '/student/quizzes',
        sourceId: requestId,
      });
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch quiz reattempt review notification: ${notifErr.message}`);
    }

    return updated;
  }

  /**
   * Get all quizzes across courses where the student is enrolled,
   * with real attempts history, lock state (gated by course assignment completion), and attempt requests.
   */
  public async getStudentEnrolledQuizzes(studentId: string, specificCourseId?: string): Promise<any[]> {
    // 1. Get enrolled course IDs
    let enrollmentsQuery = supabaseAdmin
      .from('enrollments')
      .select('course_id, courses(id, title, course_status, approval_status, instructor_id, profiles:instructor_id(full_name, avatar_url))')
      .eq('student_id', studentId);

    if (specificCourseId) {
      enrollmentsQuery = enrollmentsQuery.eq('course_id', specificCourseId);
    }

    const { data: enrollments, error: eErr } = await enrollmentsQuery;
    if (eErr || !enrollments || enrollments.length === 0) {
      return [];
    }

    const courseIds = enrollments
      .map((e) => e.course_id)
      .filter(Boolean);

    // 2. Fetch published quizzes for these courses
    const { data: quizzes, error: qErr } = await supabaseAdmin
      .from('quizzes')
      .select('*, courses(id, title, instructor_id, profiles:instructor_id(full_name, avatar_url)), course_modules(title), lessons(title)')
      .in('course_id', courseIds)
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (qErr || !quizzes || quizzes.length === 0) {
      return [];
    }

    const quizIds = quizzes.map((q) => q.id);

    // 3. Fetch questions for these quizzes (safe without correct_answer)
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, quiz_id, question_text, question_type, options, points, position, created_at, updated_at')
      .in('quiz_id', quizIds)
      .order('position', { ascending: true });

    // 4. Fetch all attempts by this student for these quizzes
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*')
      .in('quiz_id', quizIds)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // 5. Fetch reattempt requests by this student
    const { data: reattemptRequests } = await supabaseAdmin
      .from('quiz_reattempt_requests')
      .select('*')
      .in('quiz_id', quizIds)
      .eq('student_id', studentId)
      .order('requested_at', { ascending: false });

    // 6. Fetch mandatory assignments to determine lock state per course
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, course_id, title, passing_score')
      .in('course_id', courseIds)
      .eq('status', 'Published');

    const asgIds = (assignments || []).map((a) => a.id);
    const { data: submissions } = asgIds.length > 0
      ? await supabaseAdmin
          .from('assignment_submissions')
          .select('assignment_id, status, score')
          .in('assignment_id', asgIds)
          .eq('student_id', studentId)
      : { data: [] };

    // Grouping maps
    const questionsByQuiz = new Map<string, any[]>();
    (questions || []).forEach((q) => {
      let opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
      opts = opts.map((opt: any) => ({ id: opt.id, text: opt.text }));
      const list = questionsByQuiz.get(q.quiz_id) || [];
      list.push({
        id: q.id,
        quizId: q.quiz_id,
        questionText: q.question_text,
        questionType: q.question_type,
        options: opts,
        points: Number(q.points),
        position: q.position,
        correctOptionId: '',
        userSelectedOptionId: undefined,
      });
      questionsByQuiz.set(q.quiz_id, list);
    });

    const attemptsByQuiz = new Map<string, any[]>();
    (attempts || []).forEach((a) => {
      const list = attemptsByQuiz.get(a.quiz_id) || [];
      list.push(a);
      attemptsByQuiz.set(a.quiz_id, list);
    });

    const requestsByQuiz = new Map<string, any[]>();
    (reattemptRequests || []).forEach((r) => {
      const list = requestsByQuiz.get(r.quiz_id) || [];
      list.push(r);
      requestsByQuiz.set(r.quiz_id, list);
    });

    const submissionsByAsg = new Map<string, any[]>();
    ((submissions as any[]) || []).forEach((s) => {
      const list = submissionsByAsg.get(s.assignment_id) || [];
      list.push(s);
      submissionsByAsg.set(s.assignment_id, list);
    });

    // Check course assignment pass state
    const isCourseAssignmentsPassed = (cId: string): { passed: boolean; reason?: string } => {
      const courseAsgs = (assignments || []).filter((a) => a.course_id === cId);
      if (courseAsgs.length === 0) return { passed: true };

      for (const asg of courseAsgs) {
        const asgSubs = submissionsByAsg.get(asg.id) || [];
        const passingScore = asg.passing_score !== undefined && asg.passing_score !== null ? Number(asg.passing_score) : 60;
        const hasPassed = asgSubs.some(
          (s) => s.status === 'Graded' && s.score !== null && Number(s.score) >= passingScore
        );
        if (!hasPassed) {
          const hasSubmitted = asgSubs.length > 0;
          if (!hasSubmitted) {
            return {
              passed: false,
              reason: `Assignment "${asg.title}" must be submitted and passed before taking this quiz.`,
            };
          }
          const hasGraded = asgSubs.some((s) => s.status === 'Graded');
          if (!hasGraded) {
            return {
              passed: false,
              reason: `Assignment "${asg.title}" is waiting for instructor grading. Quiz unlocks after passing marks are awarded.`,
            };
          }
          return {
            passed: false,
            reason: `Assignment "${asg.title}" has not met passing score (${passingScore} pts required). Resubmit and pass to unlock this quiz.`,
          };
        }
      }
      return { passed: true };
    };

    return quizzes.map((q) => {
      const course = q.courses as any;
      const instructor = course?.profiles;
      const qQuestions = questionsByQuiz.get(q.id) || [];
      const qAttempts = attemptsByQuiz.get(q.id) || [];
      const qRequests = requestsByQuiz.get(q.id) || [];

      const completedAttempts = qAttempts.filter((a) => a.status === 'completed');
      const passedAttempt = completedAttempts.find((a) => a.passed === true);
      const latestAttempt = completedAttempts[0] || qAttempts[0];

      const baseMaxAttempts = Number(q.max_attempts) || 3;
      const approvedCount = qRequests.filter((r) => r.status === 'Approved').length;
      const effectiveMaxAttempts = baseMaxAttempts + approvedCount;
      const attemptsUsed = completedAttempts.length;

      // Status determination
      let status: 'available' | 'in_progress' | 'completed' | 'passed' | 'failed' = 'available';
      if (passedAttempt) {
        status = 'passed';
      } else if (qAttempts.some((a) => a.status === 'in_progress')) {
        status = 'in_progress';
      } else if (attemptsUsed > 0) {
        status = 'failed';
      }

      // Reattempt request status
      const latestRequest = qRequests[0];
      let attemptRequestStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
      let attemptRequestFeedback: string | undefined = undefined;
      if (latestRequest) {
        if (latestRequest.status === 'Pending') {
          attemptRequestStatus = 'pending';
        } else if (latestRequest.status === 'Approved') {
          if (attemptsUsed < effectiveMaxAttempts && !passedAttempt) {
            attemptRequestStatus = 'approved';
          } else {
            attemptRequestStatus = 'none';
          }
        } else if (latestRequest.status === 'Rejected') {
          if (attemptsUsed >= effectiveMaxAttempts && !passedAttempt) {
            attemptRequestStatus = 'rejected';
            attemptRequestFeedback = latestRequest.instructor_feedback;
          }
        }
      }

      // Assignment Lock Check
      const lockCheck = isCourseAssignmentsPassed(q.course_id);
      const isLocked = !lockCheck.passed;
      const lockReason = lockCheck.reason;

      const totalPoints = qQuestions.reduce((sum: number, question: any) => sum + (question.points || 10), 0) || 100;

      const attemptHistory = completedAttempts.map((a, idx) => ({
        id: a.id,
        quizId: q.id,
        attemptDate: new Date(a.submitted_at || a.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        attemptNumber: completedAttempts.length - idx,
        score: Number(a.score) || 0,
        maxScore: Number(a.total_score) || totalPoints,
        percentage: Number(a.percentage) || 0,
        status: (a.passed ? 'passed' : 'failed') as 'passed' | 'failed',
        timeTakenMinutes: 10,
        correctAnswersCount: 0,
        incorrectAnswersCount: 0,
        totalQuestions: qQuestions.length,
      }));

      return {
        id: q.id,
        courseId: q.course_id,
        courseTitle: course?.title || 'Masterclass',
        instructorName: instructor?.full_name || 'EduSphere Instructor',
        instructorAvatar: instructor?.avatar_url || '',
        category: course?.category || 'General',
        difficulty: course?.level || 'Intermediate',
        title: q.title,
        description: q.description || '',
        timeLimitMinutes: q.time_limit_minutes || 15,
        questionsCount: qQuestions.length,
        passingScore: Number(q.passing_score) || 60,
        totalPoints,
        maxAttempts: effectiveMaxAttempts,
        attemptsUsed,
        attemptCycle: 1,
        attemptRequestStatus,
        attemptRequestFeedback,
        status,
        lastScore: latestAttempt ? Math.round(Number(latestAttempt.percentage)) : undefined,
        instructions: Array.isArray(q.instructions) && q.instructions.length > 0
          ? q.instructions
          : [
              'Each question has a designated point value.',
              'Submit all answers before the timer expires.',
              'A passing grade unlocks your certificate upon completing all lessons and assignments.',
            ],
        questions: qQuestions,
        attemptHistory,
        isLocked,
        lockReason,
        unlockRequirement: lockReason,
      };
    });
  }
}

export const quizService = new QuizService();

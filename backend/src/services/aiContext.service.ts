import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { config } from '../config/env';
import type { AiContextType } from '../types';

export interface StudentAiContextParams {
  contextType?: AiContextType;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
}

export interface StudentAiContextResult {
  contextType: AiContextType;
  student: {
    id: string;
    name: string;
    enrolledCoursesCount: number;
  };
  course?: {
    id: string;
    title: string;
    description: string;
    category?: string;
    instructorName?: string;
    modulesCount?: number;
  };
  module?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
    type: 'Video' | 'PDF' | 'Text' | 'Resource';
    description?: string;
    contentSummary?: string;
    hasExtractedText: boolean;
  };
  assignment?: {
    id: string;
    title: string;
    instructions: string;
    maxScore: number;
    passingScore: number;
    maxAttempts: number;
    studentSubmission?: {
      attemptNumber: number;
      status: string;
      score?: number;
      feedback?: string;
    };
  };
  quiz?: {
    id: string;
    title: string;
    instructions: string;
    passingScore: number;
    maxAttempts: number;
    studentAttemptsCount: number;
    latestScorePercentage?: number;
    isPassed?: boolean;
  };
  progress?: {
    courseCompletionPercentage: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    incompleteLessonsCount: number;
    assignmentStatusSummary?: string;
    quizStatusSummary?: string;
  };
  formattedPromptContext: string;
}

export class StudentAiContextService {
  /**
   * Sanitizes text by removing HTML tags, scripts, and excessive whitespace
   */
  public sanitizeText(rawText: string | null | undefined, maxChars = 3000): string {
    if (!rawText) return '';
    return rawText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxChars);
  }

  /**
   * Builds rich, authorized, real-data student context for the AI Assistant
   */
  public async buildStudentContext(
    authenticatedStudentId: string,
    params: StudentAiContextParams
  ): Promise<StudentAiContextResult> {
    if (!authenticatedStudentId) {
      throw ApiError.unauthorized('Authenticated student identity is required.');
    }

    // 1. Fetch Student Profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', authenticatedStudentId)
      .maybeSingle();

    const studentName = profile?.full_name || 'Student';

    const result: StudentAiContextResult = {
      contextType: params.contextType || 'general',
      student: {
        id: authenticatedStudentId,
        name: studentName,
        enrolledCoursesCount: 0,
      },
      formattedPromptContext: '',
    };

    let effectiveCourseId = params.courseId;

    // 2. Fetch Lesson Context (if explicitly requested)
    if (params.lessonId) {
      try {
        const { data: lesson } = await supabaseAdmin
          .from('lessons')
          .select(`
            id,
            title,
            short_description,
            lesson_type,
            content,
            video_url,
            document_url,
            is_preview,
            course_modules (
              id,
              title,
              course_id
            )
          `)
          .eq('id', params.lessonId)
          .maybeSingle();

        if (lesson) {
          const moduleData = lesson.course_modules as any;
          effectiveCourseId = effectiveCourseId || moduleData?.course_id;

          let contentSummary = '';
          let hasExtractedText = false;

          if (lesson.lesson_type === 'Text') {
            contentSummary = this.sanitizeText(lesson.content, 2500);
            hasExtractedText = Boolean(contentSummary);
          } else if (lesson.lesson_type === 'PDF') {
            const notes = this.sanitizeText(lesson.content, 1500);
            contentSummary = notes
              ? `PDF Lecture Notes: ${notes}`
              : 'PDF document attached.';
            hasExtractedText = Boolean(notes);
          } else if (lesson.lesson_type === 'Video') {
            const notes = this.sanitizeText(lesson.content, 1500);
            contentSummary = notes
              ? `Instructor Video Lecture Notes: ${notes}`
              : `Video Lecture Overview: ${this.sanitizeText(lesson.short_description, 500)}`;
            hasExtractedText = Boolean(notes);
          } else {
            contentSummary = this.sanitizeText(lesson.short_description || lesson.content, 1000);
          }

          result.lesson = {
            id: lesson.id,
            title: lesson.title,
            type: lesson.lesson_type as any,
            description: lesson.short_description || undefined,
            contentSummary,
            hasExtractedText,
          };

          if (moduleData) {
            result.module = {
              id: moduleData.id,
              title: moduleData.title,
            };
          }
        }
      } catch (err) {
        // Non-blocking: continue if lesson lookup fails
      }
    }

    // 3. Fetch Assignment Context (if explicitly requested)
    if (params.assignmentId) {
      try {
        const { data: assignment } = await supabaseAdmin
          .from('assignments')
          .select('id, course_id, module_id, title, description, instructions, max_score, passing_score, due_days, max_attempts, status')
          .eq('id', params.assignmentId)
          .maybeSingle();

        if (assignment) {
          effectiveCourseId = effectiveCourseId || assignment.course_id;

          const { data: submissions } = await supabaseAdmin
            .from('assignment_submissions')
            .select('attempt_number, status, score, feedback, created_at')
            .eq('assignment_id', params.assignmentId)
            .eq('student_id', authenticatedStudentId)
            .order('attempt_number', { ascending: false })
            .limit(1);

          const latestSub = submissions?.[0];

          result.assignment = {
            id: assignment.id,
            title: assignment.title,
            instructions: this.sanitizeText(assignment.instructions || assignment.description, 2000),
            maxScore: Number(assignment.max_score),
            passingScore: Number(assignment.passing_score),
            maxAttempts: assignment.max_attempts || 3,
            studentSubmission: latestSub
              ? {
                  attemptNumber: latestSub.attempt_number || 1,
                  status: latestSub.status,
                  score: latestSub.score !== null ? Number(latestSub.score) : undefined,
                  feedback: latestSub.feedback ? this.sanitizeText(latestSub.feedback, 500) : undefined,
                }
              : undefined,
          };
        }
      } catch (err) {
        // Non-blocking
      }
    }

    // 4. Fetch Quiz Context (if explicitly requested)
    if (params.quizId) {
      try {
        const { data: quiz } = await supabaseAdmin
          .from('quizzes')
          .select('id, course_id, title, description, instructions, passing_score, max_attempts, time_limit_minutes, quiz_type')
          .eq('id', params.quizId)
          .maybeSingle();

        if (quiz) {
          effectiveCourseId = effectiveCourseId || quiz.course_id;

          const { data: attempts } = await supabaseAdmin
            .from('quiz_attempts')
            .select('attempt_number, score_percentage, is_passed, status')
            .eq('quiz_id', params.quizId)
            .eq('student_id', authenticatedStudentId)
            .order('attempt_number', { ascending: false });

          const attemptsList = attempts || [];
          const latestAttempt = attemptsList[0];
          const hasPassed = attemptsList.some((a) => a.is_passed);

          result.quiz = {
            id: quiz.id,
            title: quiz.title,
            instructions: this.sanitizeText(quiz.instructions || quiz.description, 1000),
            passingScore: Number(quiz.passing_score),
            maxAttempts: quiz.max_attempts || 3,
            studentAttemptsCount: attemptsList.length,
            latestScorePercentage: latestAttempt?.score_percentage !== undefined ? Number(latestAttempt.score_percentage) : undefined,
            isPassed: hasPassed,
          };
        }
      } catch (err) {
        // Non-blocking
      }
    }

    // 5. Fetch Course Details (if course is known and requested)
    if (effectiveCourseId && (params.courseId || params.lessonId || params.assignmentId || params.quizId)) {
      try {
        const { data: course } = await supabaseAdmin
          .from('courses')
          .select('id, title, short_description, full_description, category_id, profiles:instructor_id(full_name), categories(name)')
          .eq('id', effectiveCourseId)
          .maybeSingle();

        if (course) {
          result.course = {
            id: course.id,
            title: course.title,
            description: this.sanitizeText(course.short_description || course.full_description, 1000),
            category: (course.categories as any)?.name,
            instructorName: (course.profiles as any)?.full_name,
          };
        }
      } catch (err) {
        // Non-blocking
      }
    }

    // 6. Format Optional Prompt Context (only if LMS material was actually found)
    result.formattedPromptContext = this.formatContextString(result);

    return result;
  }

  /**
   * Formats structured context into an optional reference section
   */
  private formatContextString(ctx: StudentAiContextResult): string {
    const hasLmsData = Boolean(ctx.course || ctx.lesson || ctx.assignment || ctx.quiz);
    if (!hasLmsData) {
      return '';
    }

    const parts: string[] = [];
    parts.push('[OPTIONAL REFERENCE MATERIAL - Use only if the student explicitly asks about this course material; otherwise answer their general question directly]:');

    if (ctx.course) {
      parts.push(`- Course: "${ctx.course.title}"`);
      if (ctx.course.instructorName) parts.push(`  Instructor: ${ctx.course.instructorName}`);
      if (ctx.course.description) parts.push(`  Overview: ${ctx.course.description}`);
    }

    if (ctx.lesson) {
      parts.push(`- Lesson: "${ctx.lesson.title}" [Type: ${ctx.lesson.type}]`);
      if (ctx.lesson.contentSummary) {
        parts.push(`  Lesson Notes/Content: "${ctx.lesson.contentSummary}"`);
      }
    }

    if (ctx.assignment) {
      parts.push(`- Assignment: "${ctx.assignment.title}" (Passing Score: ${ctx.assignment.passingScore}/${ctx.assignment.maxScore})`);
      parts.push(`  Instructions: "${ctx.assignment.instructions}"`);
    }

    if (ctx.quiz) {
      parts.push(`- Quiz Topic: "${ctx.quiz.title}" (Passing Score: ${ctx.quiz.passingScore}%)`);
      parts.push(`  Instructions: "${ctx.quiz.instructions}"`);
    }

    const maxChars = (config.ai.maxContextTokens || 4000) * 4;
    return parts.join('\n').slice(0, maxChars);
  }
}

export const studentAiContextService = new StudentAiContextService();


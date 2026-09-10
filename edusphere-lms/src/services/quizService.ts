import { api, type ApiResponse } from './apiClient';
import type { StudentQuizDetail } from '../types';

export type QuizStatus = 'Draft' | 'Published' | 'Archived';
export type QuizType = 'Mandatory' | 'Optional';
export type QuestionType =
  | 'Single Answer'
  | 'Multiple Answer'
  | 'Fill in the Blanks'
  | 'True or False';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface BackendQuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctAnswer?: any;
  points: number;
  explanation?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendQuiz {
  id: string;
  courseId: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimitMinutes: number;
  passingScore: number;
  quizType: QuizType;
  maxAttempts: number;
  randomizeQuestions: boolean;
  shuffleOptions: boolean;
  status: QuizStatus;
  position: number;
  questionsCount?: number;
  totalAttemptsCount?: number;
  questions?: BackendQuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendQuizAttempt {
  id: string;
  quizId: string;
  quizTitle?: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'timed_out' | 'cancelled';
  answers?: {
    id: string;
    attemptId: string;
    questionId: string;
    answer: any;
    isCorrect: boolean;
    pointsAwarded: number;
    correctOptionId?: string;
    correctAnswer?: any;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}


export interface CreateQuizPayload {
  title: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  quizType?: QuizType;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  shuffleOptions?: boolean;
  status?: QuizStatus;
  position?: number;
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  quizType?: QuizType;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  shuffleOptions?: boolean;
  status?: QuizStatus;
  position?: number;
}

export interface CreateQuestionPayload {
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctAnswer?: any;
  points?: number;
  explanation?: string;
  position?: number;
}

export interface UpdateQuestionPayload {
  questionText?: string;
  questionType?: QuestionType;
  options?: QuestionOption[];
  correctAnswer?: any;
  points?: number;
  explanation?: string;
  position?: number;
}

// In-memory instant client cache for 0ms navigation
const instructorQuizzesCache = new Map<string, BackendQuiz[]>();
const quizDetailsCache = new Map<string, BackendQuiz>();

export const quizService = {
  // Synchronous cache access
  getCachedInstructorQuizzes: (courseId?: string): BackendQuiz[] | null => {
    if (courseId && instructorQuizzesCache.has(courseId)) {
      return instructorQuizzesCache.get(courseId)!;
    }
    if (!courseId && instructorQuizzesCache.size > 0) {
      return Array.from(instructorQuizzesCache.values()).flat();
    }
    return null;
  },

  getCachedQuiz: (quizId: string): BackendQuiz | null => {
    return quizDetailsCache.get(quizId) || null;
  },

  // Synchronous single quiz cache access
  getCachedCourseQuiz: (courseId: string): BackendQuiz | null => {
    if (instructorQuizzesCache.has(courseId)) {
      const list = instructorQuizzesCache.get(courseId)!;
      return list.length > 0 ? list[0] : null;
    }
    return null;
  },

  // Instructor: Get single mandatory quiz for a course
  getInstructorCourseQuiz: async (courseId: string): Promise<ApiResponse<BackendQuiz | null>> => {
    const res = await api.get<BackendQuiz[]>(`/instructor/courses/${courseId}/quizzes`);
    if (res.success && Array.isArray(res.data)) {
      instructorQuizzesCache.set(courseId, res.data);
      res.data.forEach((q) => quizDetailsCache.set(q.id, q));
      const firstQuiz = res.data.length > 0 ? res.data[0] : null;
      return {
        ...res,
        data: firstQuiz,
      };
    }
    return {
      success: res.success,
      message: res.message,
      data: null,
      timestamp: res.timestamp,
    };
  },

  // Instructor: Get all quizzes for a course
  getInstructorCourseQuizzes: async (courseId: string): Promise<ApiResponse<BackendQuiz[]>> => {
    const res = await api.get<BackendQuiz[]>(`/instructor/courses/${courseId}/quizzes`);
    if (res.success && Array.isArray(res.data)) {
      instructorQuizzesCache.set(courseId, res.data);
      res.data.forEach((q) => quizDetailsCache.set(q.id, q));
    }
    return res;
  },

  // Instructor: Get quiz by ID
  getQuizById: async (quizId: string): Promise<ApiResponse<BackendQuiz>> => {
    const res = await api.get<BackendQuiz>(`/instructor/quizzes/${quizId}`);
    if (res.success && res.data) {
      quizDetailsCache.set(quizId, res.data);
    }
    return res;
  },

  // Instructor: Create quiz
  createQuiz: async (courseId: string, payload: CreateQuizPayload): Promise<ApiResponse<BackendQuiz>> => {
    const res = await api.post<BackendQuiz>(`/instructor/courses/${courseId}/quizzes`, payload);
    if (res.success && res.data) {
      const existing = instructorQuizzesCache.get(courseId) || [];
      instructorQuizzesCache.set(courseId, [...existing, res.data]);
      quizDetailsCache.set(res.data.id, res.data);
    }
    return res;
  },

  // Instructor: Update quiz
  updateQuiz: async (quizId: string, payload: UpdateQuizPayload): Promise<ApiResponse<BackendQuiz>> => {
    const res = await api.patch<BackendQuiz>(`/instructor/quizzes/${quizId}`, payload);
    if (res.success && res.data) {
      quizDetailsCache.set(quizId, res.data);
      const courseId = res.data.courseId;
      if (courseId && instructorQuizzesCache.has(courseId)) {
        const list = instructorQuizzesCache.get(courseId)!;
        const idx = list.findIndex((q) => q.id === quizId);
        if (idx !== -1) {
          list[idx] = res.data;
          instructorQuizzesCache.set(courseId, [...list]);
        }
      }
    }
    return res;
  },

  // Instructor: Delete quiz
  deleteQuiz: async (quizId: string): Promise<ApiResponse<void>> => {
    const res = await api.delete<void>(`/instructor/quizzes/${quizId}`);
    if (res.success) {
      quizDetailsCache.delete(quizId);
      for (const [courseId, list] of instructorQuizzesCache.entries()) {
        instructorQuizzesCache.set(
          courseId,
          list.filter((q) => q.id !== quizId)
        );
      }
    }
    return res;
  },

  // Instructor: Reorder quizzes
  reorderQuizzes: async (
    courseId: string,
    items: { id: string; position: number }[]
  ): Promise<ApiResponse<void>> => {
    return api.patch<void>(`/instructor/courses/${courseId}/quizzes/reorder`, { items });
  },

  // Instructor: Get quiz questions
  getQuizQuestions: async (quizId: string): Promise<ApiResponse<BackendQuizQuestion[]>> => {
    return api.get<BackendQuizQuestion[]>(`/instructor/quizzes/${quizId}/questions`);
  },

  // Instructor: Create question
  createQuestion: async (
    quizId: string,
    payload: CreateQuestionPayload
  ): Promise<ApiResponse<BackendQuizQuestion>> => {
    return api.post<BackendQuizQuestion>(`/instructor/quizzes/${quizId}/questions`, payload);
  },

  // Instructor: Update question
  updateQuestion: async (
    questionId: string,
    payload: UpdateQuestionPayload
  ): Promise<ApiResponse<BackendQuizQuestion>> => {
    return api.patch<BackendQuizQuestion>(`/instructor/questions/${questionId}`, payload);
  },

  // Instructor: Delete question
  deleteQuestion: async (questionId: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/instructor/questions/${questionId}`);
  },

  // Instructor: Reorder questions
  reorderQuestions: async (
    quizId: string,
    items: { id: string; position: number }[]
  ): Promise<ApiResponse<void>> => {
    return api.patch<void>(`/instructor/quizzes/${quizId}/questions/reorder`, { items });
  },

  // Instructor: Publish quiz
  publishQuiz: async (quizId: string): Promise<ApiResponse<BackendQuiz>> => {
    return api.post<BackendQuiz>(`/instructor/quizzes/${quizId}/publish`);
  },

  // Instructor: Archive quiz
  archiveQuiz: async (quizId: string): Promise<ApiResponse<BackendQuiz>> => {
    return api.post<BackendQuiz>(`/instructor/quizzes/${quizId}/archive`);
  },

  // Student: Get enrolled quizzes across courses with live DB states
  getStudentEnrolledQuizzes: async (courseId?: string): Promise<ApiResponse<StudentQuizDetail[]>> => {
    const url = courseId ? `/student/quizzes?courseId=${courseId}` : '/student/quizzes';
    return api.get<StudentQuizDetail[]>(url);
  },

  // Student: Get course quizzes (Student Safe - answer keys hidden)
  getStudentCourseQuiz: async (courseId: string): Promise<ApiResponse<BackendQuiz[]>> => {
    return api.get<BackendQuiz[]>(`/courses/${courseId}/quiz`);
  },

  // Student: Get public course quizzes
  getPublicCourseQuizzes: async (courseId: string): Promise<ApiResponse<BackendQuiz[]>> => {
    return api.get<BackendQuiz[]>(`/courses/${courseId}/quizzes`);
  },

  // Student: Start attempt
  startAttempt: async (quizId: string): Promise<ApiResponse<BackendQuizAttempt>> => {
    return api.post<BackendQuizAttempt>(`/quizzes/${quizId}/attempts`);
  },

  // Student: Submit attempt
  submitAttempt: async (
    attemptId: string,
    answers: { questionId: string; answer: any }[]
  ): Promise<ApiResponse<BackendQuizAttempt>> => {
    return api.post<BackendQuizAttempt>(`/attempts/${attemptId}/submit`, { answers });
  },

  // Student: Get result
  getAttemptResult: async (attemptId: string): Promise<ApiResponse<BackendQuizAttempt>> => {
    return api.get<BackendQuizAttempt>(`/attempts/${attemptId}/result`);
  },

  // Student: Request Reattempt
  requestReattempt: async (quizId: string, reason: string): Promise<ApiResponse<any>> => {
    return api.post<any>(`/quizzes/${quizId}/reattempt-requests`, { reason });
  },

  // Student: Get own reattempt requests
  getStudentReattemptRequests: async (): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`/student/quiz-reattempt-requests`);
  },

  // Instructor: Get Reattempt Requests
  getInstructorReattemptRequests: async (): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`/instructor/quiz-reattempt-requests`);
  },

  // Instructor: Approve Reattempt Request
  approveReattemptRequest: async (requestId: string): Promise<ApiResponse<any>> => {
    const res = await api.post<any>(`/instructor/quiz-reattempt-requests/${requestId}/approve`);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('quiz-reattempt-resolved', { detail: { requestId, action: 'approved' } }));
    }
    return res;
  },

  // Instructor: Reject Reattempt Request
  rejectReattemptRequest: async (requestId: string, feedback?: string): Promise<ApiResponse<any>> => {
    const res = await api.post<any>(`/instructor/quiz-reattempt-requests/${requestId}/reject`, { feedback });
    if (res.success) {
      window.dispatchEvent(new CustomEvent('quiz-reattempt-resolved', { detail: { requestId, action: 'rejected', feedback } }));
    }
    return res;
  },
};

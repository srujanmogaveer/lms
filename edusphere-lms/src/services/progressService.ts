import { api, type ApiResponse } from './apiClient';

export type LessonProgressStatus = 'In_Progress' | 'Completed';

export interface LessonProgressItem {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  status: LessonProgressStatus;
  progressPercentage: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCourseProgressSummary {
  courseId: string;
  studentId: string;
  totalLessons: number;
  completedLessons: number;
  lessonProgressPercentage: number;
  completedLessonIds: string[];
  mandatoryAssignmentsCount: number;
  completedAssignmentsCount: number;
  assignmentsSubmitted?: boolean;
  assignmentsGraded?: boolean;
  assignmentsComplete: boolean;
  hasMandatoryQuiz: boolean;
  quizPassed: boolean;
  isCourseCompleted: boolean;
  certificateAvailable?: boolean;
  enrolledAt: string;
}

export interface VerifiedCertificateData {
  eligible: boolean;
  certificateId: string;
  certificateCode: string;
  serialCode: string;
  verificationUrl: string;
  issueDate: string;
  completionDate: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseDescription?: string;
  courseThumbnail?: string;
  durationHours?: number;
  instructorId?: string;
  instructorName: string;
  instructorTitle?: string;
  instructorAvatar?: string;
  institutionName?: string;
  accreditation?: string;
  scoreSummary?: {
    lessonsCompleted: number;
    totalLessons: number;
    assignmentsPassed: number;
    totalAssignments: number;
    quizScore: number;
    quizPassingScore: number;
  };
}

// In-memory cache for instant UI rendering
const courseProgressCache = new Map<string, StudentCourseProgressSummary>();
const lessonProgressCache = new Map<string, string[]>(); // courseId -> completedLessonIds

export const progressService = {
  // Sync Cache Reader
  getCachedCourseProgress: (courseId: string): StudentCourseProgressSummary | null => {
    return courseProgressCache.get(courseId) || null;
  },

  getCachedCompletedLessonIds: (courseId: string): string[] | null => {
    return lessonProgressCache.get(courseId) || null;
  },

  // Get batched course progress for all enrolled courses
  getAllCoursesProgress: async (): Promise<ApiResponse<Record<string, StudentCourseProgressSummary>>> => {
    const res = await api.get<Record<string, StudentCourseProgressSummary>>('/student/all-progress');
    if (res.success && res.data) {
      Object.entries(res.data).forEach(([cId, summary]) => {
        courseProgressCache.set(cId, summary);
        if (Array.isArray(summary.completedLessonIds)) {
          lessonProgressCache.set(cId, summary.completedLessonIds);
        }
      });
    }
    return res;
  },

  // Get comprehensive student progress for a course
  getCourseProgress: async (
    courseId: string
  ): Promise<ApiResponse<StudentCourseProgressSummary>> => {
    const res = await api.get<StudentCourseProgressSummary>(
      `/student/courses/${courseId}/progress`
    );
    if (res.success && res.data) {
      courseProgressCache.set(courseId, res.data);
      if (Array.isArray(res.data.completedLessonIds)) {
        lessonProgressCache.set(courseId, res.data.completedLessonIds);
      }
    }
    return res;
  },

  // Get list of lesson progress for a course
  getStudentCourseLessonsProgress: async (
    courseId: string
  ): Promise<ApiResponse<LessonProgressItem[]>> => {
    const res = await api.get<LessonProgressItem[]>(
      `/student/courses/${courseId}/lessons-progress`
    );
    if (res.success && Array.isArray(res.data)) {
      const completedIds = res.data
        .filter((item) => item.status === 'Completed')
        .map((item) => item.lessonId);
      lessonProgressCache.set(courseId, completedIds);
    }
    return res;
  },

  // Complete a lesson
  completeLesson: async (
    courseId: string,
    lessonId: string
  ): Promise<ApiResponse<LessonProgressItem>> => {
    const res = await api.post<LessonProgressItem>(
      `/student/courses/${courseId}/lessons/${lessonId}/complete`
    );
    if (res.success && res.data) {
      const current = lessonProgressCache.get(courseId) || [];
      if (!current.includes(lessonId)) {
        const updated = [...current, lessonId];
        lessonProgressCache.set(courseId, updated);

        // Update cached summary if available
        const cachedSummary = courseProgressCache.get(courseId);
        if (cachedSummary) {
          const newCompleted = cachedSummary.completedLessons + 1;
          const newPct =
            cachedSummary.totalLessons > 0
              ? Math.round((newCompleted / cachedSummary.totalLessons) * 100)
              : 100;
          courseProgressCache.set(courseId, {
            ...cachedSummary,
            completedLessons: newCompleted,
            lessonProgressPercentage: newPct,
            completedLessonIds: updated,
          });
        }
      }
    }
    return res;
  },

  // Track access / in-progress
  trackLessonAccess: async (
    courseId: string,
    lessonId: string
  ): Promise<ApiResponse<LessonProgressItem>> => {
    return api.post<LessonProgressItem>(
      `/student/courses/${courseId}/lessons/${lessonId}/access`
    );
  },

  // Get Verified Certificate Data (Protected by backend completion check)
  getCourseCertificate: async (
    courseId: string
  ): Promise<ApiResponse<VerifiedCertificateData>> => {
    return api.get<VerifiedCertificateData>(
      `/student/courses/${courseId}/certificate`
    );
  },

  // Get all student certificates directly from backend with in-memory caching
  getCachedStudentCertificates: (): any[] | null => {
    return studentCertificatesCache;
  },

  getAllStudentCertificates: async (forceRefresh = false): Promise<ApiResponse<any[]>> => {
    if (!forceRefresh && studentCertificatesCache) {
      return { success: true, data: studentCertificatesCache, message: 'Cached', timestamp: new Date().toISOString() };
    }
    const res = await api.get<any[]>('/student/certificates');
    if (res.success && Array.isArray(res.data)) {
      studentCertificatesCache = res.data;
    }
    return res;
  },
};

let studentCertificatesCache: any[] | null = null;


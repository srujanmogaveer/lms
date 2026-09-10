import { api, type ApiResponse } from './apiClient';

export type EnrollmentStatus = 'Active' | 'Completed' | 'Cancelled';

export interface FrontendEnrollment {
  id: string;
  courseId: string;
  courseTitle?: string;
  courseThumbnail?: string;
  instructorId?: string;
  instructorName?: string;
  instructorAvatar?: string;
  instructorBio?: string;
  instructorSpecialization?: string;
  instructorQualification?: string;
  category?: string;
  rating?: number;
  studentsEnrolled?: number;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  studentEmail?: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentFilters {
  status?: EnrollmentStatus | 'All';
  search?: string;
  courseId?: string;
}

// In-memory cache for 0ms instant UI rendering
let studentEnrollmentsCache: FrontendEnrollment[] | null = null;

export const enrollmentService = {
  // Synchronous cache read
  getCachedStudentEnrollments: (): FrontendEnrollment[] | null => {
    return studentEnrollmentsCache;
  },

  // Student: Get own enrollments
  getStudentEnrollments: async (): Promise<ApiResponse<FrontendEnrollment[]>> => {
    const res = await api.get<FrontendEnrollment[]>('/student/enrollments');
    if (res.success && res.data) {
      studentEnrollmentsCache = res.data;
    }
    return res;
  },

  // Student: Get single course enrollment
  getStudentEnrollment: async (courseId: string): Promise<ApiResponse<FrontendEnrollment | null>> => {
    return api.get<FrontendEnrollment | null>(`/student/enrollments/${courseId}`);
  },

  // Student: Enroll in course
  enrollInCourse: async (courseId: string): Promise<ApiResponse<FrontendEnrollment>> => {
    const res = await api.post<FrontendEnrollment>(`/courses/${courseId}/enroll`);
    if (res.success && res.data) {
      if (studentEnrollmentsCache) {
        studentEnrollmentsCache = [res.data, ...studentEnrollmentsCache.filter(e => e.courseId !== courseId)];
      }
    }
    return res;
  },

  // Student: Cancel enrollment
  cancelEnrollment: async (courseId: string): Promise<ApiResponse<void>> => {
    const res = await api.post<void>(`/student/enrollments/${courseId}/cancel`);
    if (res.success && studentEnrollmentsCache) {
      studentEnrollmentsCache = studentEnrollmentsCache.map((e) =>
        e.courseId === courseId ? { ...e, status: 'Cancelled' as const } : e
      );
    }
    return res;
  },

  // Instructor: Get course enrollments and student progress
  getInstructorEnrollments: async (
    filters?: EnrollmentFilters
  ): Promise<ApiResponse<{ students: any[]; courses: { id: string; title: string }[] } | any>> => {
    const params: Record<string, string> = {};
    if (filters?.courseId && filters.courseId !== 'All') params.courseId = filters.courseId;
    if (filters?.status && filters.status !== 'All') params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    return api.get('/instructor/enrollments', params);
  },

  // Admin: Get all enrollments
  getAdminEnrollments: async (filters?: EnrollmentFilters): Promise<ApiResponse<FrontendEnrollment[]>> => {
    const params = new URLSearchParams();
    if (filters?.courseId && filters.courseId !== 'All') params.append('courseId', filters.courseId);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get<FrontendEnrollment[]>(`/admin/enrollments${queryString}`);
  },
};

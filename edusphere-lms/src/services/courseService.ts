import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { InstructorCourseItem, CourseDifficultyType, CourseLanguageType } from '../data/instructorCoursesData';
import type { Course } from '../types';

export interface CourseCompletionSummary {
  courseComplete: boolean;
  courseInfoComplete: boolean;
  curriculumComplete: boolean;
  contentComplete: boolean;
  assignmentsComplete: boolean;
  quizzesComplete: boolean;
  modulesCount: number;
  lessonsCount: number;
  assignmentsCount: number;
  quizzesCount: number;
  missingItems: string[];
}

export interface CourseCreatePayload {
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId?: string;
  category?: string;
  subcategory?: string;
  difficulty?: CourseDifficultyType;
  language?: CourseLanguageType;
  thumbnail: string;
  promoVideoUrl?: string;
  price: number;
  discountPrice?: number;
  tags?: string[];
  requirements?: string[];
  learningOutcomes?: string[];
  isSubmitForApproval?: boolean;
}

// In-memory cache for instructor courses and single course records
let instructorCoursesCache: InstructorCourseItem[] | null = null;
const singleCourseCache = new Map<string, InstructorCourseItem>();
let isFetchingInstructorCourses = false;
let pendingInstructorCoursesPromise: Promise<ApiResponse<InstructorCourseItem[]>> | null = null;

export const courseService = {
  // Public & Student Course Catalog
  getPublicCourses: async (params?: Record<string, any>): Promise<ApiResponse<Course[]>> => {
    return api.get<Course[]>('/courses', params);
  },

  // Public Platform Aggregate Statistics
  getPublicPlatformStats: async (): Promise<ApiResponse<{
    activeStudents: number;
    expertInstructors: number;
    publishedCourses: number;
    certificatesAwarded: number;
  }>> => {
    return api.get('/courses/public/stats');
  },

  // Public Leadership & Faculty
  getPublicLeadership: async (): Promise<ApiResponse<{
    id: string;
    name: string;
    role: string;
    photo: string;
    bio: string;
    qualification?: string;
    specialization?: string;
  }[]>> => {
    return api.get('/courses/public/leadership');
  },

  // Public & Student Single Course
  getCourseByIdOrSlug: async (idOrSlug: string): Promise<ApiResponse<Course>> => {
    return api.get<Course>(`/courses/${idOrSlug}`);
  },

  // Public & Student Single Course by Slug
  getCourseBySlug: async (slug: string): Promise<ApiResponse<Course>> => {
    return api.get<Course>(`/courses/slug/${slug}`);
  },

  // Instructor: Get cached instructor courses synchronously if available
  getCachedInstructorCourses: (): InstructorCourseItem[] | null => {
    return instructorCoursesCache;
  },

  // Instructor: Invalidate or update course cache directly
  setCachedInstructorCourses: (courses: InstructorCourseItem[]) => {
    instructorCoursesCache = courses;
  },

  // Instructor: Get single cached course by ID
  getCachedCourseById: (courseId: string): InstructorCourseItem | null => {
    if (singleCourseCache.has(courseId)) {
      return singleCourseCache.get(courseId)!;
    }
    if (instructorCoursesCache) {
      const found = instructorCoursesCache.find((c) => c.id === courseId);
      if (found) return found;
    }
    return null;
  },

  // Instructor: List own courses with in-flight deduplication and instant cache
  getInstructorCourses: async (params?: Record<string, any>, forceRefresh = false): Promise<ApiResponse<InstructorCourseItem[]>> => {
    if (!forceRefresh && instructorCoursesCache && (!params || Object.keys(params).length === 0)) {
      return {
        success: true,
        message: 'Loaded from cache',
        data: instructorCoursesCache,
        timestamp: new Date().toISOString(),
      };
    }

    if (isFetchingInstructorCourses && pendingInstructorCoursesPromise && !forceRefresh) {
      return pendingInstructorCoursesPromise;
    }

    isFetchingInstructorCourses = true;
    pendingInstructorCoursesPromise = (async () => {
      try {
        const res = await api.get<InstructorCourseItem[]>('/instructor/courses', params);
        if (res.success && Array.isArray(res.data)) {
          instructorCoursesCache = res.data;
          res.data.forEach((c) => singleCourseCache.set(c.id, c));
        }
        return res;
      } finally {
        isFetchingInstructorCourses = false;
        pendingInstructorCoursesPromise = null;
      }
    })();

    return pendingInstructorCoursesPromise;
  },

  // Instructor: Get single own course
  getInstructorCourseById: async (id: string): Promise<ApiResponse<InstructorCourseItem>> => {
    // If cached, return immediately and refresh in background
    const cached = singleCourseCache.get(id);
    if (cached) {
      api.get<InstructorCourseItem>(`/courses/instructor/courses/${id}`).then((res) => {
        if (res.success && res.data) {
          singleCourseCache.set(id, res.data);
        }
      }).catch(() => null);
      return {
        success: true,
        message: 'Loaded from cache',
        data: cached,
        timestamp: new Date().toISOString(),
      };
    }

    const res = await api.get<InstructorCourseItem>(`/courses/instructor/courses/${id}`);
    if (res.success && res.data) {
      singleCourseCache.set(id, res.data);
    }
    return res;
  },

  // Instructor: Create course draft
  createCourse: async (payload: CourseCreatePayload): Promise<ApiResponse<InstructorCourseItem>> => {
    const res = await api.post<InstructorCourseItem>('/courses/instructor/courses', payload);
    if (res.success && res.data) {
      singleCourseCache.set(res.data.id, res.data);
      if (instructorCoursesCache) {
        instructorCoursesCache = [res.data, ...instructorCoursesCache.filter((c) => c.id !== res.data!.id)];
      } else {
        instructorCoursesCache = [res.data];
      }
    }
    return res;
  },

  // Instructor: Update own course
  updateInstructorCourse: async (id: string, payload: Partial<CourseCreatePayload>): Promise<ApiResponse<InstructorCourseItem>> => {
    const res = await api.patch<InstructorCourseItem>(`/courses/instructor/courses/${id}`, payload);
    if (res.success && res.data) {
      singleCourseCache.set(id, res.data);
      if (instructorCoursesCache) {
        instructorCoursesCache = instructorCoursesCache.map((c) => (c.id === id ? res.data! : c));
      }
    }
    return res;
  },

  // Instructor: Get course completion validation summary
  getCourseCompletion: async (id: string): Promise<ApiResponse<CourseCompletionSummary>> => {
    return api.get<CourseCompletionSummary>(`/courses/instructor/courses/${id}/completion`);
  },

  // Instructor: Submit course for admin approval
  submitCourseForApproval: async (id: string): Promise<ApiResponse<InstructorCourseItem>> => {
    const res = await api.post<InstructorCourseItem>(`/courses/instructor/courses/${id}/submit`);
    if (res.success && res.data) {
      singleCourseCache.set(id, res.data);
      if (instructorCoursesCache) {
        instructorCoursesCache = instructorCoursesCache.map((c) => (c.id === id ? res.data! : c));
      }
    }
    return res;
  },

  // Instructor: Delete own course
  deleteInstructorCourse: async (id: string): Promise<ApiResponse<void>> => {
    const res = await api.delete<void>(`/courses/instructor/courses/${id}`);
    singleCourseCache.delete(id);
    if (instructorCoursesCache) {
      instructorCoursesCache = instructorCoursesCache.filter((c) => c.id !== id);
    }
    return res;
  },

  // Instructor: Upload course thumbnail image
  uploadThumbnail: async (file: File, slug?: string): Promise<ApiResponse<{ thumbnailUrl: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    if (slug) {
      formData.append('slug', slug);
    }
    return api.upload<{ thumbnailUrl: string }>('/courses/instructor/upload-thumbnail', formData);
  },

  // Instructor: Get real dashboard stats
  getInstructorDashboardStats: async (): Promise<ApiResponse<any>> => {
    return api.get<any>('/instructor/stats');
  },

  // Admin: List all courses
  getAdminCourses: async (params?: Record<string, any>): Promise<ApiResponse<InstructorCourseItem[]>> => {
    return api.get<InstructorCourseItem[]>('/admin/courses', params);
  },

  // Admin: Get single course review details
  getAdminCourseById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get<any>(`/admin/courses/${id}`);
  },

  // Admin: Approve course
  approveCourse: async (id: string): Promise<ApiResponse<InstructorCourseItem>> => {
    return api.post<InstructorCourseItem>(`/admin/courses/${id}/approve`);
  },

  // Admin: Reject course
  rejectCourse: async (id: string, rejectionReason: string): Promise<ApiResponse<InstructorCourseItem>> => {
    return api.post<InstructorCourseItem>(`/admin/courses/${id}/reject`, { rejectionReason });
  },

  // Admin: Delete course
  deleteAdminCourse: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/admin/courses/${id}`);
  },
};

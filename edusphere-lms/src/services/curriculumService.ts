import { api } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface BackendLesson {
  id: string;
  moduleId: string;
  courseId?: string;
  title: string;
  shortDescription?: string;
  lessonType: 'Video' | 'PDF' | 'Text' | 'Resource';
  content?: string;
  videoUrl?: string;
  documentUrl?: string;
  resourceUrl?: string;
  durationMinutes: number;
  position: number;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  position: number;
  lessons: BackendLesson[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendCurriculumResponse {
  courseId: string;
  courseTitle: string;
  category?: string;
  difficulty?: string;
  thumbnail?: string;
  modules: BackendModule[];
}

export interface UploadFileResponse {
  url: string;
  path?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  path: string;
  expiresIn: number;
}

// In-memory cache for course modules
const courseModulesCache = new Map<string, BackendModule[]>();

export const curriculumService = {
  // Synchronous cache read for instant 0ms rendering
  getCachedCourseModules: (courseId: string): BackendModule[] | null => {
    return courseModulesCache.get(courseId) || null;
  },

  // Invalidate or update cache directly
  setCachedCourseModules: (courseId: string, modules: BackendModule[]) => {
    courseModulesCache.set(courseId, modules);
  },

  // =============================================================
  // Instructor Module APIs
  // =============================================================

  /**
   * Get all modules (and nested lessons) for a course
   */
  getInstructorCourseModules: async (courseId: string): Promise<ApiResponse<BackendModule[]>> => {
    const res = await api.get<BackendModule[]>(`/instructor/courses/${courseId}/modules`);
    if (res.success && Array.isArray(res.data)) {
      courseModulesCache.set(courseId, res.data);
    }
    return res;
  },

  /**
   * Create a new module
   */
  createModule: async (
    courseId: string,
    payload: { title: string; description?: string; position?: number }
  ): Promise<ApiResponse<BackendModule>> => {
    const res = await api.post<BackendModule>(`/instructor/courses/${courseId}/modules`, payload);
    if (res.success && res.data) {
      const current = courseModulesCache.get(courseId) || [];
      courseModulesCache.set(courseId, [...current, res.data]);
    }
    return res;
  },

  /**
   * Update an existing module
   */
  updateModule: async (
    moduleId: string,
    payload: { title?: string; description?: string; position?: number }
  ): Promise<ApiResponse<BackendModule>> => {
    const res = await api.patch<BackendModule>(`/instructor/modules/${moduleId}`, payload);
    if (res.success && res.data) {
      const updated = res.data;
      courseModulesCache.forEach((list, cId) => {
        if (list.some((m) => m.id === moduleId)) {
          courseModulesCache.set(
            cId,
            list.map((m) => (m.id === moduleId ? { ...m, ...updated } : m))
          );
        }
      });
    }
    return res;
  },

  /**
   * Delete a module
   */
  deleteModule: async (moduleId: string): Promise<ApiResponse<void>> => {
    const res = await api.delete<void>(`/instructor/modules/${moduleId}`);
    if (res.success) {
      courseModulesCache.forEach((list, cId) => {
        courseModulesCache.set(
          cId,
          list.filter((m) => m.id !== moduleId)
        );
      });
    }
    return res;
  },

  /**
   * Reorder modules
   */
  reorderModules: (
    courseId: string,
    items: Array<{ id: string; position: number }>
  ): Promise<ApiResponse<BackendModule[]>> => {
    return api.patch(`/instructor/courses/${courseId}/modules/reorder`, { items });
  },

  // =============================================================
  // Instructor Lesson APIs
  // =============================================================

  /**
   * Get all lessons for a module
   */
  getInstructorModuleLessons: (moduleId: string): Promise<ApiResponse<BackendLesson[]>> => {
    return api.get(`/instructor/modules/${moduleId}/lessons`);
  },

  /**
   * Get single lesson by ID
   */
  getInstructorLessonById: (lessonId: string): Promise<ApiResponse<BackendLesson>> => {
    return api.get(`/instructor/lessons/${lessonId}`);
  },

  /**
   * Create a new lesson
   */
  createLesson: async (
    moduleId: string,
    payload: {
      title: string;
      shortDescription?: string;
      lessonType: 'Video' | 'PDF' | 'Text' | 'Resource';
      content?: string | null;
      videoUrl?: string | null;
      documentUrl?: string | null;
      resourceUrl?: string | null;
      durationMinutes?: number;
      position?: number;
      isPreview?: boolean;
    }
  ): Promise<ApiResponse<BackendLesson>> => {
    const res = await api.post<BackendLesson>(`/instructor/modules/${moduleId}/lessons`, payload);
    if (res.success && res.data) {
      const newLesson = res.data;
      courseModulesCache.forEach((list, cId) => {
        if (list.some((m) => m.id === moduleId)) {
          courseModulesCache.set(
            cId,
            list.map((m) => {
              if (m.id === moduleId) {
                return { ...m, lessons: [...(m.lessons || []), newLesson] };
              }
              return m;
            })
          );
        }
      });
    }
    return res;
  },

  /**
   * Update an existing lesson
   */
  updateLesson: async (
    lessonId: string,
    payload: {
      title?: string;
      shortDescription?: string;
      lessonType?: 'Video' | 'PDF' | 'Text' | 'Resource';
      content?: string | null;
      videoUrl?: string | null;
      documentUrl?: string | null;
      resourceUrl?: string | null;
      durationMinutes?: number;
      position?: number;
      isPreview?: boolean;
    }
  ): Promise<ApiResponse<BackendLesson>> => {
    const res = await api.patch<BackendLesson>(`/instructor/lessons/${lessonId}`, payload);
    if (res.success && res.data) {
      const updated = res.data;
      courseModulesCache.forEach((list, cId) => {
        courseModulesCache.set(
          cId,
          list.map((m) => ({
            ...m,
            lessons: (m.lessons || []).map((l) => (l.id === lessonId ? { ...l, ...updated } : l)),
          }))
        );
      });
    }
    return res;
  },

  /**
   * Delete a lesson
   */
  deleteLesson: async (lessonId: string): Promise<ApiResponse<void>> => {
    const res = await api.delete<void>(`/instructor/lessons/${lessonId}`);
    if (res.success) {
      courseModulesCache.forEach((list, cId) => {
        courseModulesCache.set(
          cId,
          list.map((m) => ({
            ...m,
            lessons: (m.lessons || []).filter((l) => l.id !== lessonId),
          }))
        );
      });
    }
    return res;
  },

  /**
   * Reorder lessons within a module
   */
  reorderLessons: (
    moduleId: string,
    items: Array<{ id: string; position: number }>
  ): Promise<ApiResponse<BackendLesson[]>> => {
    return api.patch(`/instructor/modules/${moduleId}/lessons/reorder`, { items });
  },

  // =============================================================
  // Storage File Upload APIs
  // =============================================================

  /**
   * Upload PDF document to Supabase Storage (lesson-documents bucket)
   */
  uploadDocument: (
    file: File,
    lessonId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<ApiResponse<UploadFileResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (lessonId) formData.append('lessonId', lessonId);
    if (courseId) formData.append('courseId', courseId);
    if (moduleId) formData.append('moduleId', moduleId);

    return api.upload('/instructor/upload/document', formData);
  },

  /**
   * Request signed URL from backend for private PDF document in lesson-documents
   */
  getSignedDocumentUrl: (
    path: string,
    download?: boolean,
    filename?: string
  ): Promise<ApiResponse<SignedUrlResponse>> => {
    const query = new URLSearchParams({ path });
    if (download) query.set('download', 'true');
    if (filename) query.set('filename', filename);
    return api.get(`/curriculum/storage/signed-document-url?${query.toString()}`);
  },

  /**
   * Upload resource file to Supabase Storage (lesson-resources bucket)
   */
  uploadResource: (
    file: File,
    lessonId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<ApiResponse<UploadFileResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (lessonId) formData.append('lessonId', lessonId);
    if (courseId) formData.append('courseId', courseId);
    if (moduleId) formData.append('moduleId', moduleId);

    return api.upload('/instructor/upload/resource', formData);
  },

  /**
   * Upload video file to Supabase Storage (lesson-resources bucket)
   */
  uploadVideo: (
    file: File,
    lessonId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<ApiResponse<UploadFileResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (lessonId) formData.append('lessonId', lessonId);
    if (courseId) formData.append('courseId', courseId);
    if (moduleId) formData.append('moduleId', moduleId);

    return api.upload('/instructor/upload/video', formData);
  },

  /**
   * Request signed URL from backend for video in lesson-resources
   */
  getSignedVideoUrl: (
    path: string
  ): Promise<ApiResponse<SignedUrlResponse>> => {
    const query = new URLSearchParams({ path });
    return api.get(`/curriculum/storage/signed-video-url?${query.toString()}`);
  },

  // =============================================================
  // Public & Student Curriculum APIs
  // =============================================================

  /**
   * Get public course curriculum
   */
  getPublicCourseCurriculum: (
    courseIdOrSlug: string
  ): Promise<ApiResponse<BackendCurriculumResponse>> => {
    return api.get(`/courses/${courseIdOrSlug}/curriculum`);
  },

  /**
   * Get public module
   */
  getPublicModule: (
    courseId: string,
    moduleId: string
  ): Promise<ApiResponse<BackendModule>> => {
    return api.get(`/courses/${courseId}/modules/${moduleId}`);
  },

  /**
   * Get public lesson
   */
  getPublicLesson: (lessonId: string): Promise<ApiResponse<BackendLesson>> => {
    return api.get(`/lessons/${lessonId}`);
  },
};

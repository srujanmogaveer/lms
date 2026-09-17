import { api, type ApiResponse } from './apiClient';

export type AssignmentStatus = 'Draft' | 'Published' | 'Archived';
export type SubmissionStatus = 'Submitted' | 'Under Review' | 'Graded' | 'Resubmission Requested';

export interface BackendAssignment {
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
  dueDays: number;
  maxScore: number;
  passingScore: number;
  maxAttempts: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status: AssignmentStatus;
  position: number;
  submissionsCount?: number;
  gradedCount?: number;
  pendingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  courseId?: string;
  courseTitle?: string;
  maxScore?: number;
  passingScore?: number;
  dueDate?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  submissionText?: string;
  fileUrl?: string;
  attemptNumber: number;
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  gradedAt?: string;
  gradedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  dueDays?: number;
  maxScore: number;
  passingScore?: number;
  maxAttempts?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status?: AssignmentStatus;
  position?: number;
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  instructions?: string;
  moduleId?: string;
  lessonId?: string;
  dueDays?: number;
  maxScore?: number;
  passingScore?: number;
  maxAttempts?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentType?: string;
  status?: AssignmentStatus;
  position?: number;
}

export interface GradeSubmissionPayload {
  score: number;
  feedback?: string;
  status?: SubmissionStatus;
}

// In-memory cache for course assignments
const courseAssignmentsCache = new Map<string, BackendAssignment[]>();
const studentEnrolledAssignmentsCache = new Map<string, any[]>();

export const assignmentService = {
  // Sync memory cache getter for student enrolled assignments
  getCachedStudentEnrolledAssignments: (courseId?: string): any[] | null => {
    const key = courseId || 'all';
    return studentEnrolledAssignmentsCache.get(key) || null;
  },

  clearStudentAssignmentsCache: (): void => {
    studentEnrolledAssignmentsCache.clear();
  },

  // Sync memory cache getter
  getCachedInstructorAssignments: (courseId: string): BackendAssignment[] | null => {
    return courseAssignmentsCache.get(courseId) || null;
  },

  // Instructor: Get all assignments across all courses
  getAllInstructorAssignments: async (): Promise<ApiResponse<BackendAssignment[]>> => {
    const res = await api.get<BackendAssignment[]>('/instructor/assignments');
    return res;
  },

  // Instructor: Get all assignments for a course
  getInstructorCourseAssignments: async (courseId: string): Promise<ApiResponse<BackendAssignment[]>> => {
    const res = await api.get<BackendAssignment[]>(`/instructor/courses/${courseId}/assignments`);
    if (res.success && Array.isArray(res.data)) {
      courseAssignmentsCache.set(courseId, res.data);
    }
    return res;
  },

  // Instructor: Create assignment
  createAssignment: async (
    courseId: string,
    payload: CreateAssignmentPayload
  ): Promise<ApiResponse<BackendAssignment>> => {
    const res = await api.post<BackendAssignment>(`/instructor/courses/${courseId}/assignments`, payload);
    if (res.success && res.data) {
      const current = courseAssignmentsCache.get(courseId) || [];
      courseAssignmentsCache.set(courseId, [res.data, ...current]);
    }
    return res;
  },

  // Instructor: Update assignment
  updateAssignment: async (
    assignmentId: string,
    payload: UpdateAssignmentPayload
  ): Promise<ApiResponse<BackendAssignment>> => {
    const res = await api.patch<BackendAssignment>(`/instructor/assignments/${assignmentId}`, payload);
    if (res.success && res.data) {
      const updatedItem = res.data;
      courseAssignmentsCache.forEach((list, cId) => {
        if (list.some((a) => a.id === assignmentId)) {
          courseAssignmentsCache.set(
            cId,
            list.map((a) => (a.id === assignmentId ? updatedItem : a))
          );
        }
      });
    }
    return res;
  },

  // Instructor: Delete assignment
  deleteAssignment: async (assignmentId: string): Promise<ApiResponse<void>> => {
    const res = await api.delete<void>(`/instructor/assignments/${assignmentId}`);
    if (res.success) {
      courseAssignmentsCache.forEach((list, cId) => {
        courseAssignmentsCache.set(
          cId,
          list.filter((a) => a.id !== assignmentId)
        );
      });
    }
    return res;
  },

  // Instructor: Reorder assignments
  reorderAssignments: async (
    courseId: string,
    items: { id: string; position: number }[]
  ): Promise<ApiResponse<void>> => {
    return api.patch<void>(`/instructor/courses/${courseId}/assignments/reorder`, { items });
  },

  // Instructor: Get submissions for an assignment
  getAssignmentSubmissions: async (assignmentId: string): Promise<ApiResponse<BackendSubmission[]>> => {
    return api.get<BackendSubmission[]>(`/instructor/assignments/${assignmentId}/submissions`);
  },

  // Instructor: Get all pending submissions across instructor courses
  getInstructorPendingSubmissions: async (courseId?: string): Promise<ApiResponse<BackendSubmission[]>> => {
    const query = courseId && courseId !== 'All' ? `?courseId=${encodeURIComponent(courseId)}` : '';
    return api.get<BackendSubmission[]>(`/instructor/submissions/pending${query}`);
  },

  // Instructor: Get single submission details by submissionId
  getInstructorSubmissionById: async (submissionId: string): Promise<ApiResponse<BackendSubmission>> => {
    return api.get<BackendSubmission>(`/instructor/submissions/${submissionId}`);
  },

  // Instructor: Get signed URL for submission file (for inline PDF preview)
  getSubmissionFileUrl: async (submissionId: string): Promise<ApiResponse<{ signedUrl: string; fileName: string; mimeType: string }>> => {
    return api.get(`/instructor/submissions/${submissionId}/file-url`);
  },

  // Instructor: Grade a submission
  gradeSubmission: async (
    submissionId: string,
    payload: GradeSubmissionPayload
  ): Promise<ApiResponse<BackendSubmission>> => {
    const res = await api.patch<BackendSubmission>(`/instructor/submissions/${submissionId}/grade`, payload);
    if (res.success) {
      window.dispatchEvent(
        new CustomEvent('assignment-graded', {
          detail: { submissionId, ...payload },
        })
      );
    }
    return res;
  },

  // Student: Get enrolled assignments with live submission statuses
  getStudentEnrolledAssignments: async (courseId?: string): Promise<ApiResponse<any[]>> => {
    const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    const res = await api.get<any[]>(`/student/assignments${query}`);
    if (res.success && Array.isArray(res.data)) {
      studentEnrolledAssignmentsCache.set(courseId || 'all', res.data);
    }
    return res;
  },

  // Student: Get course assignments
  getPublicCourseAssignments: async (courseId: string): Promise<ApiResponse<BackendAssignment[]>> => {
    return api.get<BackendAssignment[]>(`/courses/${courseId}/assignments`);
  },

  // Student: Get assignment details
  getAssignmentById: async (assignmentId: string): Promise<ApiResponse<BackendAssignment>> => {
    return api.get<BackendAssignment>(`/assignments/${assignmentId}`);
  },

  // Student: Upload submission file securely via backend
  uploadSubmissionFile: async (
    assignmentId: string,
    file: File
  ): Promise<ApiResponse<{ path: string; fileName: string; fileSize: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ path: string; fileName: string; fileSize: number }>(
      `/assignments/${assignmentId}/upload`,
      formData
    );
  },

  // Student: Submit assignment
  submitAssignment: async (
    assignmentId: string,
    payload: { submissionText?: string; fileUrl?: string }
  ): Promise<ApiResponse<BackendSubmission>> => {
    return api.post<BackendSubmission>(`/assignments/${assignmentId}/submissions`, payload);
  },

  // Student: Get single submission
  getStudentSubmission: async (submissionId: string): Promise<ApiResponse<BackendSubmission>> => {
    return api.get<BackendSubmission>(`/student/submissions/${submissionId}`);
  },

  // Student: Get signed download URL for their own submission file
  getStudentSubmissionFileUrl: async (
    submissionId: string
  ): Promise<ApiResponse<{ signedUrl: string; fileName: string; mimeType: string }>> => {
    return api.get<{ signedUrl: string; fileName: string; mimeType: string }>(
      `/student/submissions/${submissionId}/file-url`
    );
  },

  // Student: Request additional assignment attempt
  requestExtraAttempt: async (
    assignmentId: string,
    reason: string
  ): Promise<ApiResponse<any>> => {
    return api.post<any>(`/assignments/${assignmentId}/reattempt-requests`, { reason });
  },

  // Student: Get own assignment reattempt requests
  getStudentReattemptRequests: async (): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>('/student/assignments/reattempt-requests');
  },

  // Instructor: Get assignment reattempt requests
  getInstructorReattemptRequests: async (courseId?: string): Promise<ApiResponse<any[]>> => {
    const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    return api.get<any[]>(`/instructor/assignment-reattempt-requests${query}`);
  },

  // Instructor: Approve assignment reattempt request
  approveReattemptRequest: async (requestId: string): Promise<ApiResponse<any>> => {
    return api.post<any>(`/instructor/assignment-reattempt-requests/${requestId}/approve`, {});
  },

  // Instructor: Reject assignment reattempt request
  rejectReattemptRequest: async (
    requestId: string,
    feedback?: string
  ): Promise<ApiResponse<any>> => {
    return api.post<any>(`/instructor/assignment-reattempt-requests/${requestId}/reject`, {
      status: 'Rejected',
      feedback,
    });
  },
};


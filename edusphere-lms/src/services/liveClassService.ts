import { api } from './apiClient';

export type LiveClassStatus = 'Scheduled' | 'Live' | 'Completed' | 'Cancelled' | 'Draft';
export type LiveClassAudienceType = 'All Enrolled Students' | 'Selected Students';

export interface LiveClassResource {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface BackendLiveClass {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  instructorRole?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  platform: string;
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  status: LiveClassStatus;
  audienceType: LiveClassAudienceType;
  selectedStudentIds?: string[];
  selectedStudentNames?: string[];
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
  isRecordingAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
  enrolledStudentsCount?: number;
  questionsCount?: number;
}

export interface BackendLiveClassQA {
  id: string;
  liveClassId: string;
  studentId: string;
  studentName?: string;
  studentAvatar?: string;
  questionText: string;
  likesCount: number;
  isPinned: boolean;
  isAnswered: boolean;
  instructorReply?: string;
  instructorReplyAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendLiveClassParticipant {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'student' | 'instructor' | 'admin';
  joinedAt: string;
  leftAt?: string | null;
  isActive: boolean;
}

export interface AdminLiveClassPage {
  liveClasses: BackendLiveClass[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLiveClassPayload {
  title: string;
  courseId: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  platform?: string;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  status?: LiveClassStatus;
  audienceType?: LiveClassAudienceType;
  selectedStudentIds?: string[];
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
}

export interface UpdateLiveClassPayload {
  title?: string;
  courseId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  platform?: string;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  status?: LiveClassStatus;
  audienceType?: LiveClassAudienceType;
  selectedStudentIds?: string[];
  instructions?: string;
  resources?: LiveClassResource[];
  recordingUrl?: string;
  isRecordingAvailable?: boolean;
}

export interface RescheduleLiveClassPayload {
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}

export interface LiveClassFilterOptions {
  courseId?: string;
  instructorId?: string;
  status?: string;
  search?: string;
}

export const liveClassService = {
  // ============================================================
  // STUDENT API METHODS
  // ============================================================

  /**
   * Fetch live classes for active enrolled courses of the current student
   */
  async getStudentLiveClasses(filters: LiveClassFilterOptions = {}): Promise<BackendLiveClass[]> {
    const params = new URLSearchParams();
    if (filters.courseId && filters.courseId !== 'all') params.append('courseId', filters.courseId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());

    const queryString = params.toString();
    const url = `/student/live-classes${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<BackendLiveClass[]>(url);
    const result = response.data;
    if (Array.isArray(result)) return result;
    if (result && Array.isArray((result as any).data)) return (result as any).data;
    return [];
  },

  /**
   * Fetch single live class details with active enrollment verification
   */
  async getStudentLiveClassDetails(classId: string): Promise<BackendLiveClass> {
    const response = await api.get<BackendLiveClass>(`/student/live-classes/${classId}`);
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  // ============================================================
  // INSTRUCTOR API METHODS
  // ============================================================

  /**
   * Fetch all live classes for the authenticated instructor
   */
  async getInstructorLiveClasses(filters: LiveClassFilterOptions = {}): Promise<BackendLiveClass[]> {
    const params = new URLSearchParams();
    if (filters.courseId && filters.courseId !== 'all' && filters.courseId !== 'All') params.append('courseId', filters.courseId);
    if (filters.status && filters.status !== 'all' && filters.status !== 'All') params.append('status', filters.status);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());

    const queryString = params.toString();
    const url = `/instructor/live-classes${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<BackendLiveClass[]>(url);
    const result = response.data;
    if (Array.isArray(result)) return result;
    if (result && Array.isArray((result as any).data)) return (result as any).data;
    return [];
  },

  /**
   * Fetch single live class details with instructor ownership check
   */
  async getInstructorLiveClassDetails(classId: string): Promise<BackendLiveClass> {
    const response = await api.get<BackendLiveClass>(`/instructor/live-classes/${classId}`);
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  /**
   * Schedule a new live class for an owned course
   */
  async createLiveClass(courseId: string, payload: CreateLiveClassPayload): Promise<BackendLiveClass> {
    const response = await api.post<BackendLiveClass>(
      `/instructor/courses/${courseId}/live-classes`,
      payload
    );
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  /**
   * Update live class parameters
   */
  async updateLiveClass(classId: string, payload: UpdateLiveClassPayload): Promise<BackendLiveClass> {
    const response = await api.patch<BackendLiveClass>(
      `/instructor/live-classes/${classId}`,
      payload
    );
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  /**
   * Reschedule date/time of a live class
   */
  async rescheduleLiveClass(classId: string, payload: RescheduleLiveClassPayload): Promise<BackendLiveClass> {
    const response = await api.patch<BackendLiveClass>(
      `/instructor/live-classes/${classId}/reschedule`,
      payload
    );
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  /**
   * Cancel an instructor live class
   */
  async cancelLiveClass(classId: string): Promise<BackendLiveClass> {
    const response = await api.patch<BackendLiveClass>(
      `/instructor/live-classes/${classId}/cancel`
    );
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  /**
   * Permanently delete a live class
   */
  async deleteLiveClass(classId: string): Promise<{ success: boolean; id: string }> {
    const response = await api.delete<{ success: boolean; id: string }>(
      `/instructor/live-classes/${classId}`
    );
    return (response.data as any)?.data || response.data || { success: true, id: classId };
  },

  // ============================================================
  // ADMIN API METHODS
  // ============================================================

  /**
   * Global list of all live classes for administrator
   */
  async getAdminLiveClasses(
    filters: LiveClassFilterOptions & { page?: number; limit?: number } = {}
  ): Promise<AdminLiveClassPage> {
    const params = new URLSearchParams();
    if (filters.instructorId && filters.instructorId !== 'all') params.append('instructorId', filters.instructorId);
    if (filters.courseId && filters.courseId !== 'all') params.append('courseId', filters.courseId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = `/admin/live-classes${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<AdminLiveClassPage>(url);
    const result = response.data as any;
    // Backend returns paginated result wrapped in { data: { liveClasses, total, page, limit, totalPages } }
    const payload = result?.data || result;
    return {
      liveClasses: Array.isArray(payload?.liveClasses) ? payload.liveClasses : [],
      total: payload?.total ?? 0,
      page: payload?.page ?? 1,
      limit: payload?.limit ?? 20,
      totalPages: payload?.totalPages ?? 1,
    };
  },

  /**
   * Admin cancel live class
   */
  async adminCancelLiveClass(classId: string): Promise<BackendLiveClass> {
    const response = await api.patch<BackendLiveClass>(
      `/admin/live-classes/${classId}/cancel`
    );
    return (response.data as any)?.data || response.data as BackendLiveClass;
  },

  /**
   * Admin delete live class
   */
  async adminDeleteLiveClass(classId: string): Promise<{ success: boolean; id: string }> {
    const response = await api.delete<{ success: boolean; id: string }>(
      `/admin/live-classes/${classId}`
    );
    return (response.data as any)?.data || response.data || { success: true, id: classId };
  },

  // ============================================================
  // PARTICIPANT TRACKING METHODS
  // ============================================================

  /**
   * Record joining the classroom (called on InAppLiveClassRoom mount)
   */
  async recordParticipantJoin(classId: string): Promise<void> {
    try {
      await api.post(`/live-classes/${classId}/participants/join`);
    } catch {
      // Non-critical — tracking failure must not block access
    }
  },

  /**
   * Record leaving the classroom (called on unmount or leave action)
   */
  async recordParticipantLeave(classId: string): Promise<void> {
    try {
      await api.post(`/live-classes/${classId}/participants/leave`);
    } catch {
      // Non-critical
    }
  },

  /**
   * Get participant list for the classroom (instructor/admin only for full list)
   */
  async getParticipants(classId: string): Promise<BackendLiveClassParticipant[]> {
    const response = await api.get<BackendLiveClassParticipant[]>(
      `/live-classes/${classId}/participants`
    );
    const result = response.data;
    if (Array.isArray(result)) return result;
    if (result && Array.isArray((result as any).data)) return (result as any).data;
    return [];
  },
  // ============================================================
  // LIVE CLASS JOIN & AUTHORIZATION
  // ============================================================

  /**
   * Authorize and verify joining/starting a live class session
   * Generates LiveKit WebRTC access token and room connection details
   */
  async joinLiveClass(classId: string): Promise<{
    id: string;
    title: string;
    status: LiveClassStatus;
    platform: string;
    meetingUrl: string;
    meetingId: string;
    roomName: string;
    isHost: boolean;
    token?: string;
    serverUrl?: string;
  }> {
    const response = await api.post<{
      id: string;
      title: string;
      status: LiveClassStatus;
      platform: string;
      meetingUrl: string;
      meetingId: string;
      roomName: string;
      isHost: boolean;
      token?: string;
      serverUrl?: string;
    }>(`/live-classes/${classId}/join`);
    return (response.data as any)?.data || response.data;
  },

  // ============================================================
  // LIVE CLASS Q&A METHODS
  // ============================================================

  /**
   * Get Q&A questions for a class
   */
  async getQuestions(classId: string): Promise<BackendLiveClassQA[]> {
    const response = await api.get<BackendLiveClassQA[]>(
      `/live-classes/${classId}/questions`
    );
    const result = response.data;
    if (Array.isArray(result)) return result;
    if (result && Array.isArray((result as any).data)) return (result as any).data;
    return [];
  },

  /**
   * Student ask question
   */
  async askQuestion(classId: string, questionText: string): Promise<BackendLiveClassQA> {
    const response = await api.post<BackendLiveClassQA>(
      `/live-classes/${classId}/questions`,
      { questionText }
    );
    return (response.data as any)?.data || response.data as BackendLiveClassQA;
  },

  /**
   * Instructor reply to question
   */
  async replyToQuestion(classId: string, questionId: string, instructorReply: string): Promise<BackendLiveClassQA> {
    const response = await api.post<BackendLiveClassQA>(
      `/live-classes/${classId}/questions/${questionId}/reply`,
      { instructorReply }
    );
    return (response.data as any)?.data || response.data as BackendLiveClassQA;
  },

  /**
   * Instructor toggle pin on question
   */
  async togglePinQuestion(classId: string, questionId: string): Promise<BackendLiveClassQA> {
    const response = await api.patch<BackendLiveClassQA>(
      `/live-classes/${classId}/questions/${questionId}/pin`
    );
    return (response.data as any)?.data || response.data as BackendLiveClassQA;
  },

  /**
   * Delete a question
   */
  async deleteQuestion(classId: string, questionId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(
      `/live-classes/${classId}/questions/${questionId}`
    );
    return (response.data as any)?.data || response.data || { success: true };
  },
};

import { api } from './apiClient';
import type { CertificateRecord, CertificateDashboardMetrics } from '../data/certificateData';
import type { InstructorPayoutInfo } from '../types/payoutTypes';

export interface AdminUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  avatarUrl: string;
  phone?: string;
  bio?: string;
  headline?: string;
  studentIdNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  linkedInUrl?: string;
  personalWebsite?: string;
  learningStreakDays?: number;
  enrolledCoursesCount?: number;
  completedCoursesCount?: number;
  certificatesCount?: number;
  instructorApprovalStatus?: 'pending' | 'approved' | 'rejected';
  qualification?: string;
  experience?: string;
  category?: string;
  specialization?: string;
  coursesCreatedCount?: number;
  coursesCreated?: any[];
  totalStudents?: number;
  instructorRating?: number;
  adminPermissions?: string[];
  payoutInfo?: InstructorPayoutInfo;
  notificationPreferences?: any;
  privacySettings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInstructorApprovalReview {
  id: string;
  instructorId: string;
  reviewedBy: string;
  previousStatus: string;
  newStatus: string;
  rejectionReason?: string;
  reviewedAt: string;
}

export interface AdminDashboardStats {
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  instructors: {
    total: number;
    pending: number;
    approved: number;
    active: number;
  };
  courses: {
    total: number;
    published: number;
    pending: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
  };
}

export const adminService = {
  /**
   * Fetch all registered students
   */
  getStudents: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status.toLowerCase());
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const endpoint = `/admin/students${query.toString() ? `?${query.toString()}` : ''}`;
    return api.get<AdminUserProfile[]>(endpoint);
  },

  /**
   * Fetch all registered instructors
   */
  getInstructors: async (params?: {
    search?: string;
    status?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status.toLowerCase());
    if (params?.approvalStatus && params.approvalStatus !== 'All') {
      query.set('approvalStatus', params.approvalStatus.toLowerCase());
    }
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const endpoint = `/admin/instructors${query.toString() ? `?${query.toString()}` : ''}`;
    return api.get<AdminUserProfile[]>(endpoint);
  },

  /**
   * Fetch pending instructors awaiting approval
   */
  getPendingInstructors: async () => {
    return api.get<AdminUserProfile[]>('/admin/instructors/pending');
  },

  /**
   * Get single user by ID
   */
  getUserById: async (userId: string) => {
    return api.get<AdminUserProfile>(`/admin/users/${userId}`);
  },

  /**
   * Update user status (active, inactive, suspended)
   */
  updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'suspended' | 'pending_approval') => {
    return api.patch<AdminUserProfile>(`/admin/users/${userId}/status`, { status });
  },

  /**
   * Approve instructor application
   */
  approveInstructor: async (instructorId: string) => {
    return api.post<{ profile: AdminUserProfile; review: AdminInstructorApprovalReview }>(
      `/admin/instructors/${instructorId}/approve`
    );
  },

  /**
   * Reject instructor application with reason
   */
  rejectInstructor: async (instructorId: string, rejectionReason?: string) => {
    return api.post<{ profile: AdminUserProfile; review: AdminInstructorApprovalReview }>(
      `/admin/instructors/${instructorId}/reject`,
      { rejectionReason }
    );
  },

  /**
   * Reopen / Undo rejection for an instructor application
   */
  reopenInstructor: async (instructorId: string) => {
    return api.post<{ profile: AdminUserProfile; review: AdminInstructorApprovalReview }>(
      `/admin/instructors/${instructorId}/reopen`
    );
  },

  /**
   * Create instructor account directly from admin portal
   */
  createInstructor: async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    qualification: string;
    experience: string;
    specialization?: string;
    bio?: string;
  }) => {
    return api.post<AdminUserProfile>('/admin/instructors', data);
  },

  /**
   * Update instructor profile details
   */
  updateInstructor: async (instructorId: string, data: Partial<AdminUserProfile>) => {
    return api.put<AdminUserProfile>(`/admin/instructors/${instructorId}`, data);
  },

  /**
   * Get approval review history for an instructor
   */
  getInstructorHistory: async (instructorId: string) => {
    return api.get<AdminInstructorApprovalReview[]>(`/admin/instructors/${instructorId}/history`);
  },

  /**
   * Delete user account
   */
  deleteUser: async (userId: string) => {
    return api.delete(`/admin/users/${userId}`);
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    return api.get<AdminDashboardStats>('/admin/dashboard/stats');
  },

  /**
   * Get all verified certificates and metrics for Admin Certificate Management
   */
  getCertificates: async () => {
    return api.get<{
      certificates: CertificateRecord[];
      metrics: CertificateDashboardMetrics;
    }>('/admin/certificates');
  },

  /**
   * Record verified instructor payout
   */
  recordInstructorPayout: async (data: {
    instructorId: string;
    amount: number;
    payoutMethod: string;
    transactionId: string;
    paymentDate?: string;
    notes?: string;
  }) => {
    return api.post<{
      payout: any;
      financials: any;
    }>('/admin/payouts', data);
  },

  /**
   * Get all persistent instructor payouts
   */
  getAllInstructorPayouts: async () => {
    return api.get<any[]>('/admin/payouts');
  },
};

import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { User } from '../types';

export interface AuthSessionData {
  user: {
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
    specialization?: string;
    coursesCreatedCount?: number;
    totalStudents?: number;
    instructorRating?: number;
    adminPermissions?: string[];
    themePreference?: string;
    languagePreference?: string;
    payoutInfo?: any;
    notificationPreferences?: any;
    privacySettings?: any;
    createdAt?: string;
    updatedAt?: string;
  };
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  } | null;
}

/**
 * Adapter converting backend UserProfile to frontend User interface
 */
export const mapProfileToUser = (profile: any): User => {
  const rawAvatar = profile.avatarUrl || profile.avatar || '';
  const safeAvatar = rawAvatar && !rawAvatar.includes('photo-1534528741775-53994a69daeb') ? rawAvatar : '';

  return {
    id: profile.id,
    name: profile.fullName || profile.name || 'EduSphere User',
    email: profile.email,
    role: profile.role,
    avatar: safeAvatar,
    bio: profile.bio || profile.headline || '',
    joinedDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'August 2026',
    status: (profile.status === 'pending_approval' ? 'inactive' : profile.status) || 'active',
  };
};

export const authService = {
  // Student registration
  registerStudent: async (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    termsAgreed: boolean;
  }): Promise<ApiResponse<AuthSessionData>> => {
    return api.post<AuthSessionData>('/auth/register/student', payload);
  },

  // Instructor registration
  registerInstructor: async (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
    qualification?: string;
    experience?: string;
    specialization?: string;
    category?: string;
    termsAgreed: boolean;
  }): Promise<ApiResponse<AuthSessionData>> => {
    return api.post<AuthSessionData>('/auth/register/instructor', payload);
  },

  // Upload Avatar Image
  uploadAvatarImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload<{ url: string }>('/auth/upload-avatar', formData);
  },

  // Login
  login: async (payload: {
    email: string;
    password: string;
    role?: 'student' | 'instructor' | 'admin';
  }): Promise<ApiResponse<AuthSessionData>> => {
    return api.post<AuthSessionData>('/auth/login', payload);
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    return api.post<void>('/auth/logout');
  },

  // Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    return api.get<any>('/auth/me');
  },

  // Update profile
  updateProfile: async (payload: any): Promise<ApiResponse<any>> => {
    return api.put<any>('/auth/profile', payload);
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (password: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/auth/reset-password', { password });
  },

  // Permanently delete user account
  deleteAccount: async (): Promise<ApiResponse<void>> => {
    return api.delete<void>('/auth/account');
  },
};

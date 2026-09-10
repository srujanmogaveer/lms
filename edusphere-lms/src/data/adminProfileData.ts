export interface AdminProfileData {
  adminId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: string;
  avatarUrl: string;
  lastLogin: string;
  lastLoginIp: string;
  accountStatus: 'Active' | 'Suspended' | 'Pending';
  createdDate: string;
  twoFactorEnabled: boolean;
}

// NOTE: initialAdminProfile mock removed — AdminProfile.tsx now reads
// exclusively from rawProfile via useAuth() and Supabase public.profiles.


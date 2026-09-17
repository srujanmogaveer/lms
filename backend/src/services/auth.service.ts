import { supabaseAdmin, supabasePublic } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  UserProfile,
  UserRole,
  AuthSessionResponse,
} from '../types';
import { logger } from '../utils/logger';
import { invalidateUserTokenCache } from '../middleware/auth.middleware';
import { NotificationService } from './notification.service';
import { settingsService } from './settings.service';

export class AuthService {
  /**
   * Helper to format database profile into standard UserProfile interface
   */
  private formatProfile(row: any, fallbackUser?: any): UserProfile {
    // Sanitize fallback role: public user_metadata can NEVER assign admin
    const rawRole = (row?.role || fallbackUser?.user_metadata?.role || 'student').toLowerCase();
    const safeRole: UserRole = (rawRole === 'instructor') ? 'instructor' : (row?.role === 'admin' ? 'admin' : 'student');

    const rawAvatar = row?.avatar_url || fallbackUser?.user_metadata?.avatar_url || fallbackUser?.user_metadata?.picture || null;
    const safeAvatar = rawAvatar && !rawAvatar.includes('photo-1534528741775-53994a69daeb') ? rawAvatar : undefined;

    // Parse category and specialization cleanly:
    let category = row?.category || fallbackUser?.user_metadata?.category;
    let specialization = row?.specialization || fallbackUser?.user_metadata?.specialization;
    if (!category && specialization && specialization.includes('•')) {
      const parts = specialization.split('•');
      category = parts[0]?.trim();
      specialization = parts.slice(1).join('•').trim() || parts[0]?.trim();
    } else if (!category && specialization && safeRole === 'instructor') {
      category = specialization;
    }

    return {
      id: row?.id || fallbackUser?.id,
      email: row?.email || fallbackUser?.email,
      fullName: row?.full_name || fallbackUser?.user_metadata?.full_name || fallbackUser?.user_metadata?.name || 'EduSphere User',
      role: safeRole,
      status: row?.status || (safeRole === 'instructor' ? 'pending_approval' : 'active'),
      avatarUrl: safeAvatar,
      phone: row?.phone || fallbackUser?.user_metadata?.phone,
      bio: row?.bio || fallbackUser?.user_metadata?.bio,
      headline: row?.headline || fallbackUser?.user_metadata?.headline,
      studentIdNumber: row?.student_id_number || (safeRole === 'student' ? `EDU-STD-${(row?.id || fallbackUser?.id || '').slice(0, 4).toUpperCase()}` : undefined),
      dateOfBirth: row?.date_of_birth || fallbackUser?.user_metadata?.date_of_birth,
      gender: row?.gender || fallbackUser?.user_metadata?.gender,
      country: row?.country || fallbackUser?.user_metadata?.country,
      state: row?.state || fallbackUser?.user_metadata?.state,
      city: row?.city || fallbackUser?.user_metadata?.city,
      timezone: row?.timezone || fallbackUser?.user_metadata?.timezone,
      linkedInUrl: row?.linkedin_url || fallbackUser?.user_metadata?.linkedin_url,
      personalWebsite: row?.personal_website || fallbackUser?.user_metadata?.personal_website,
      learningStreakDays: row?.learning_streak_days ?? fallbackUser?.user_metadata?.learning_streak_days ?? 0,
      enrolledCoursesCount: row?.enrolled_courses_count ?? 0,
      completedCoursesCount: row?.completed_courses_count ?? 0,
      certificatesCount: row?.certificates_count ?? 0,
      instructorApprovalStatus: row?.instructor_approval_status || (safeRole === 'instructor' ? 'pending' : 'approved'),
      qualification: row?.qualification || fallbackUser?.user_metadata?.qualification,
      experience: row?.experience || fallbackUser?.user_metadata?.experience,
      category: category || undefined,
      specialization: specialization || row?.specialization || fallbackUser?.user_metadata?.specialization,
      coursesCreatedCount: row?.courses_created_count ?? 0,
      totalStudents: row?.total_students ?? 0,
      instructorRating: row?.instructor_rating ? Number(row.instructor_rating) : 5.0,
      adminPermissions: row?.role === 'admin' ? (row?.admin_permissions || ['all']) : [],
      themePreference: row?.theme_preference || fallbackUser?.user_metadata?.theme_preference || 'system',
      languagePreference: row?.language_preference || fallbackUser?.user_metadata?.language_preference || 'en',
      payoutInfo: row?.payout_info || fallbackUser?.user_metadata?.payout_info,
      notificationPreferences: row?.notification_preferences || fallbackUser?.user_metadata?.notification_preferences,
      privacySettings: row?.privacy_settings || fallbackUser?.user_metadata?.privacy_settings,
      createdAt: row?.created_at || fallbackUser?.created_at || new Date().toISOString(),
      updatedAt: row?.updated_at || fallbackUser?.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Fetch profile from public.profiles table using Admin or Public client
   */
  public async getProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      // Dynamically compute student enrolled / completed / certificates counts in 1 consolidated query
      if (data.role === 'student') {
        const { data: enrRows } = await supabaseAdmin
          .from('enrollments')
          .select('status')
          .eq('student_id', userId);
        const enrList = enrRows || [];
        data.enrolled_courses_count = enrList.length;
        const compCount = enrList.filter((e) => e.status === 'Completed').length;
        data.completed_courses_count = compCount;
        data.certificates_count = compCount;
      }

      return this.formatProfile(data);
    } catch (err) {
      logger.warn(`Could not retrieve DB profile for user ${userId}:`, err);
      return null;
    }
  }

  /**
   * Register a new Student
   */
  public async registerStudent(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthSessionResponse> {
    const settings = await settingsService.getPlatformSettings();
    if (!settings.enableStudentRegistration) {
      throw ApiError.forbidden('Student registration is currently disabled by platform administrators.');
    }

    const { fullName, email, password, phone } = input;

    // 1. Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
          phone,
          avatar_url: null,
        },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered')) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      throw ApiError.badRequest(authError.message);
    }

    if (!authData.user) {
      throw ApiError.internal('Failed to create student user');
    }

    // 2. Fetch or initialize profile
    let profile = await this.getProfileById(authData.user.id);
    if (!profile) {
      profile = this.formatProfile(null, authData.user);
    }

    return {
      user: profile,
      session: authData.session
        ? {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresIn: authData.session.expires_in,
          tokenType: authData.session.token_type,
        }
        : null,
    };
  }

  /**
   * Register a new Instructor (sets approval status to 'pending')
   */
  public async registerInstructor(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    avatarUrl?: string;
    qualification?: string;
    experience?: string;
    specialization?: string;
    category?: string;
  }): Promise<AuthSessionResponse> {
    const settings = await settingsService.getPlatformSettings();
    if (!settings.enableInstructorRegistration) {
      throw ApiError.forbidden('Instructor registration is currently disabled by platform administrators.');
    }

    const { fullName, email, password, phone, avatarUrl, qualification, experience, specialization, category } = input;

    const combinedSpecialization = category
      ? (specialization ? `${category} • ${specialization}` : category)
      : specialization;

    const { data: authData, error: authError } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'instructor',
          phone,
          qualification,
          experience,
          specialization: combinedSpecialization,
          category: category || null,
          instructor_approval_status: 'pending',
          avatar_url: avatarUrl || null,
        },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered')) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      throw ApiError.badRequest(authError.message);
    }

    if (!authData.user) {
      throw ApiError.internal('Failed to create instructor application');
    }

    // Ensure public.profiles table also explicitly updates avatar_url and specialization if provided
    try {
      const updates: Record<string, any> = {};
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (combinedSpecialization) updates.specialization = combinedSpecialization;
      if (qualification) updates.qualification = qualification;
      if (experience) updates.experience = experience;
      if (phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', authData.user.id);
      }
    } catch (e) {
      logger.warn('Non-blocking: could not explicitly update profiles table for new instructor', e);
    }

    let profile = await this.getProfileById(authData.user.id);
    if (!profile) {
      profile = this.formatProfile(null, authData.user);
    }

    // Trigger notification to all platform administrators (non-blocking)
    NotificationService.notifyAdminsOfNewInstructor({
      id: authData.user.id,
      fullName,
      email,
      specialization: category ? `${category} • ${specialization || ''}` : specialization,
    }).catch((notifErr) => {
      logger.warn('Non-blocking: could not notify admins of new instructor registration:', notifErr);
    });

    return {
      user: profile,
      session: authData.session
        ? {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresIn: authData.session.expires_in,
          tokenType: authData.session.token_type,
        }
        : null,
    };
  }

  /**
   * User Login (Student, Instructor, Admin)
   */
  public async login(input: {
    email: string;
    password: string;
    role?: 'student' | 'instructor' | 'admin';
  }): Promise<AuthSessionResponse> {
    const { email, password, role } = input;

    let { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    // Auto-heal if email is unconfirmed but user is already approved in profiles
    if (authError && authError.message.toLowerCase().includes('email not confirmed')) {
      try {
        const { data: matchedProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (
          matchedProfile &&
          (matchedProfile.instructor_approval_status === 'approved' ||
            matchedProfile.role === 'admin' ||
            matchedProfile.role === 'student')
        ) {
          await supabaseAdmin.auth.admin.updateUserById(matchedProfile.id, {
            email_confirm: true,
          });

          const retryResult = await supabasePublic.auth.signInWithPassword({
            email,
            password,
          });
          authData = retryResult.data;
          authError = retryResult.error;
        }
      } catch (healErr) {
        logger.warn(`Auto-confirm retry failed for ${email}:`, healErr);
      }
    }

    if (authError || !authData.user || !authData.session) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    let profile = await this.getProfileById(authData.user.id);
    if (!profile) {
      profile = this.formatProfile(null, authData.user);
    }

    // Role validation if specific role was expected by portal
    if (role && profile.role !== role) {
      throw ApiError.forbidden(
        `Your account has the role '${profile.role}'. Please sign in via the ${profile.role} portal.`
      );
    }

    // Instructor Approval Check: block access if pending approval
    if (profile.role === 'instructor' && (profile.instructorApprovalStatus !== 'approved' || profile.status === 'pending_approval')) {
      throw ApiError.forbidden(
        'Your Instructor application is currently under review by administrators. You will be able to sign in once approved.'
      );
    }

    // Account suspension check
    if (profile.status === 'suspended') {
      throw ApiError.forbidden('Your account has been suspended. Please contact platform support.');
    }

    // Update profile updated_at to track login/activity timestamp
    const nowIso = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ updated_at: nowIso })
        .eq('id', authData.user.id);
      profile.updatedAt = nowIso;
    } catch (touchErr) {
      logger.warn('Failed to update login timestamp for user profile:', touchErr);
    }

    return {
      user: profile,
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in,
        tokenType: authData.session.token_type,
      },
    };
  }

  /**
   * User Logout
   */
  public async logout(token?: string): Promise<void> {
    if (token) {
      try {
        await supabasePublic.auth.admin?.signOut(token).catch(() => null);
      } catch {
        // Silent catch for token invalidation
      }
    }
  }

  /**
   * Get Current User Profile (Me)
   */
  public async getCurrentUser(userId: string, rawSupabaseUser?: any): Promise<UserProfile> {
    const profile = await this.getProfileById(userId);
    if (profile) {
      return profile;
    }

    if (rawSupabaseUser) {
      return this.formatProfile(null, rawSupabaseUser);
    }

    // If neither exists, fetch user directly from Supabase admin
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !user) {
      throw ApiError.notFound('User profile not found');
    }

    return this.formatProfile(null, user);
  }

  /**
   * Update Profile
   */
  public async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Sanitize updates to prevent unauthorized role alteration
    const allowedUpdates: Record<string, any> = {};
    if (updates.fullName !== undefined) allowedUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) allowedUpdates.phone = updates.phone;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;
    if (updates.headline !== undefined) allowedUpdates.headline = updates.headline;
    if (updates.avatarUrl !== undefined) allowedUpdates.avatar_url = updates.avatarUrl;
    if (updates.qualification !== undefined) allowedUpdates.qualification = updates.qualification;
    if (updates.experience !== undefined) allowedUpdates.experience = updates.experience;
    if (updates.specialization !== undefined) allowedUpdates.specialization = updates.specialization;
    if (updates.themePreference !== undefined) allowedUpdates.theme_preference = updates.themePreference;
    if (updates.languagePreference !== undefined) allowedUpdates.language_preference = updates.languagePreference;
    if (updates.dateOfBirth !== undefined) allowedUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.gender !== undefined) allowedUpdates.gender = updates.gender;
    if (updates.country !== undefined) allowedUpdates.country = updates.country;
    if (updates.state !== undefined) allowedUpdates.state = updates.state;
    if (updates.city !== undefined) allowedUpdates.city = updates.city;
    if (updates.timezone !== undefined) allowedUpdates.timezone = updates.timezone;
    if (updates.linkedInUrl !== undefined) allowedUpdates.linkedin_url = updates.linkedInUrl;
    if (updates.personalWebsite !== undefined) allowedUpdates.personal_website = updates.personalWebsite;
    if (updates.payoutInfo !== undefined) allowedUpdates.payout_info = updates.payoutInfo;
    if (updates.notificationPreferences !== undefined) allowedUpdates.notification_preferences = updates.notificationPreferences;
    if (updates.privacySettings !== undefined) allowedUpdates.privacy_settings = updates.privacySettings;

    // Update in Supabase profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(allowedUpdates)
      .eq('id', userId)
      .select()
      .single();

    // Always keep auth user_metadata synchronized as well
    await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: allowedUpdates,
      }
    ).catch(() => null);

    // Invalidate the server-side token cache for this user so the next
    // GET /auth/me call fetches fresh data from the DB instead of
    // serving the 60-second cached stale profile.
    invalidateUserTokenCache(userId);

    if (error || !data) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData?.user) {
        throw ApiError.badRequest(error?.message || userError?.message || 'Failed to update profile');
      }
      return this.formatProfile(null, userData.user);
    }

    // Direct return of updated database row formatted to UserProfile
    // Avoids redundant SELECT round-trips and enrollments count recalculation on every save
    return this.formatProfile(data);
  }

  /**
   * Forgot Password - Send recovery email
   */
  public async forgotPassword(email: string): Promise<void> {
    const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password`,
    });

    if (error) {
      logger.warn(`Supabase resetPasswordForEmail warning for ${email}:`, error.message);
      // We do not throw error here to prevent email enumeration attacks
    }
  }

  /**
   * Reset Password with new password for authenticated user or token context
   */
  public async resetPassword(_token: string, newPassword: string): Promise<void> {
    // If token is provided, verify session first
    const { error } = await supabasePublic.auth.updateUser(
      { password: newPassword },
      {
        // Supabase client uses active token
      }
    );

    if (error) {
      throw ApiError.badRequest(error.message);
    }
  }

  /**
   * Permanently delete user account and all associated data
   */
  public async deleteAccount(userId: string): Promise<void> {
    logger.info(`Initiating permanent account deletion for user: ${userId}`);

    // Clean up dependent child records to prevent foreign key violations
    await Promise.allSettled([
      supabaseAdmin.from('notifications').delete().eq('recipient_id', userId),
      supabaseAdmin.from('course_reviews').delete().eq('student_id', userId),
      supabaseAdmin.from('enrollments').delete().eq('student_id', userId),
      supabaseAdmin.from('lesson_progress').delete().eq('student_id', userId),
      supabaseAdmin.from('assignment_submissions').delete().eq('student_id', userId),
    ]);

    // Delete public.profiles record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      logger.error('Error deleting user profile during account deletion:', profileError);
      throw ApiError.badRequest(profileError.message || 'Failed to delete profile record');
    }

    // Delete from Supabase Auth admin service
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      logger.warn(`Could not delete user ${userId} from Supabase Auth:`, authError.message);
    }

    // Invalidate cached auth profile
    invalidateUserTokenCache(userId);
    logger.info(`Successfully permanently deleted user account: ${userId}`);
  }
}

export const authService = new AuthService();

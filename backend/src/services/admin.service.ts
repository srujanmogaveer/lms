import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  UserProfile,
  UserRole,
  AccountStatus,
  InstructorApprovalStatus,
  InstructorApprovalReview,
  UserQueryFilters,
} from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class AdminService {
  /**
   * Helper to format database profile into standard UserProfile interface
   */
  private formatProfile(row: any, dynamicCoursesCount?: number): UserProfile {
    const rawAvatar = row.avatar_url || null;
    const safeAvatar = rawAvatar && !rawAvatar.includes('photo-1534528741775-53994a69daeb') ? rawAvatar : undefined;

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role as UserRole,
      status: row.status as AccountStatus,
      avatarUrl: safeAvatar,
      phone: row.phone,
      bio: row.bio,
      headline: row.headline,
      studentIdNumber: row.student_id_number,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      country: row.country,
      state: row.state,
      city: row.city,
      timezone: row.timezone,
      linkedInUrl: row.linkedin_url,
      personalWebsite: row.personal_website,
      learningStreakDays: row.learning_streak_days ?? 0,
      enrolledCoursesCount: row.enrolled_courses_count ?? 0,
      completedCoursesCount: row.completed_courses_count ?? 0,
      certificatesCount: row.certificates_count ?? 0,
      instructorApprovalStatus: row.instructor_approval_status as InstructorApprovalStatus,
      qualification: row.qualification,
      experience: row.experience,
      specialization: row.specialization,
      coursesCreatedCount: dynamicCoursesCount !== undefined ? dynamicCoursesCount : (row.courses_created_count ?? 0),
      totalStudents: row.total_students ?? 0,
      instructorRating: row.instructor_rating ? Number(row.instructor_rating) : 5.0,
      adminPermissions: row.admin_permissions || ['all'],
      themePreference: row.theme_preference || 'system',
      languagePreference: row.language_preference || 'en',
      payoutInfo: row.payout_info,
      notificationPreferences: row.notification_preferences,
      privacySettings: row.privacy_settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List users with dynamic filtering, searching, and pagination
   */
  public async getUsers(filters: UserQueryFilters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 50;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        phone,
        bio,
        headline,
        student_id_number,
        country,
        state,
        city,
        timezone,
        linkedin_url,
        personal_website,
        learning_streak_days,
        enrolled_courses_count,
        completed_courses_count,
        certificates_count,
        instructor_approval_status,
        qualification,
        experience,
        specialization,
        courses_created_count,
        total_students,
        instructor_rating,
        admin_permissions,
        theme_preference,
        language_preference,
        created_at,
        updated_at
      `, { count: 'exact' });

    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.approvalStatus) {
      query = query.eq('instructor_approval_status', filters.approvalStatus);
    }
    if (filters.search) {
      const s = filters.search.trim();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,student_id_number.ilike.%${s}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Error fetching users in AdminService:', error);
      throw ApiError.internal('Failed to retrieve users');
    }

    // Dynamically calculate actual created courses count for instructors from courses table
    const instructorIds = (data || [])
      .filter((r) => r.role === 'instructor' || r.instructor_approval_status)
      .map((r) => r.id);

    const coursesCountMap: Record<string, number> = {};
    if (instructorIds.length > 0) {
      const { data: courseRows } = await supabaseAdmin
        .from('courses')
        .select('instructor_id')
        .in('instructor_id', instructorIds);

      if (courseRows) {
        courseRows.forEach((c) => {
          coursesCountMap[c.instructor_id] = (coursesCountMap[c.instructor_id] || 0) + 1;
        });
      }
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users: (data || []).map((row) =>
        this.formatProfile(row, coursesCountMap[row.id] !== undefined ? coursesCountMap[row.id] : undefined)
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single user profile by ID
   */
  public async getUserById(userId: string): Promise<UserProfile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw ApiError.notFound('User profile not found');
    }

    let coursesCount: number | undefined = undefined;
    if (data.role === 'instructor' || data.instructor_approval_status) {
      const { count: cCount } = await supabaseAdmin
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', userId);
      coursesCount = cCount || 0;
    }

    return this.formatProfile(data, coursesCount);
  }

  /**
   * Update user status (active, inactive, suspended)
   */
  public async updateUserStatus(userId: string, newStatus: AccountStatus): Promise<UserProfile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      logger.error('Error updating user status:', error);
      throw ApiError.badRequest('Failed to update user status');
    }

    return this.formatProfile(data);
  }

  /**
   * Approve Instructor Application:
   * status = 'active'
   * instructor_approval_status = 'approved'
   */
  public async approveInstructor(
    instructorId: string,
    reviewerId: string
  ): Promise<{ profile: UserProfile; review: InstructorApprovalReview }> {
    const currentProfile = await this.getUserById(instructorId);
    if (currentProfile.role !== 'instructor') {
      throw ApiError.badRequest('Selected user is not an instructor');
    }

    const previousStatus = currentProfile.instructorApprovalStatus || 'pending';

    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'active',
        instructor_approval_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorId)
      .select()
      .single();

    if (profileError || !updatedProfile) {
      logger.error('Error approving instructor:', profileError);
      throw ApiError.badRequest('Failed to approve instructor');
    }

    // Ensure Supabase Auth user is confirmed and metadata synchronized
    try {
      await supabaseAdmin.auth.admin.updateUserById(instructorId, {
        email_confirm: true,
        user_metadata: {
          ...currentProfile,
          instructor_approval_status: 'approved',
          role: 'instructor',
        },
      });
    } catch (authSyncErr) {
      logger.warn('Non-blocking: could not sync email_confirm to auth.users:', authSyncErr);
    }

    // Insert audit review record
    const { data: reviewData } = await supabaseAdmin
      .from('instructor_approval_reviews')
      .insert({
        instructor_id: instructorId,
        reviewed_by: reviewerId,
        previous_status: previousStatus,
        new_status: 'approved',
        rejection_reason: null,
      })
      .select()
      .single();

    const review: InstructorApprovalReview = {
      id: reviewData?.id || 'rev-' + Date.now(),
      instructorId,
      reviewedBy: reviewerId,
      previousStatus,
      newStatus: 'approved',
      rejectionReason: undefined,
      reviewedAt: reviewData?.reviewed_at || new Date().toISOString(),
    };

    // Notify instructor in-app (non-blocking)
    NotificationService.notifyInstructorOfApproval(instructorId).catch((err) => {
      logger.warn('Non-blocking: could not send approval notification to instructor:', err);
    });

    return {
      profile: this.formatProfile(updatedProfile),
      review,
    };
  }

  /**
   * Reopen / Undo Rejection on Instructor Application:
   * status = 'inactive'
   * instructor_approval_status = 'pending'
   */
  public async reopenInstructor(
    instructorId: string,
    reviewerId: string
  ): Promise<{ profile: UserProfile; review: InstructorApprovalReview }> {
    const currentProfile = await this.getUserById(instructorId);
    if (currentProfile.role !== 'instructor') {
      throw ApiError.badRequest('Selected user is not an instructor');
    }

    const previousStatus = currentProfile.instructorApprovalStatus || 'rejected';

    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'inactive',
        instructor_approval_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorId)
      .select()
      .single();

    if (profileError || !updatedProfile) {
      logger.error('Error reopening instructor application:', profileError);
      throw ApiError.badRequest('Failed to reopen instructor application');
    }

    // Insert audit review record
    const { data: reviewData } = await supabaseAdmin
      .from('instructor_approval_reviews')
      .insert({
        instructor_id: instructorId,
        reviewed_by: reviewerId,
        previous_status: previousStatus,
        new_status: 'pending',
        rejection_reason: null,
      })
      .select()
      .single();

    const review: InstructorApprovalReview = {
      id: reviewData?.id || 'rev-' + Date.now(),
      instructorId,
      reviewedBy: reviewerId,
      previousStatus,
      newStatus: 'pending',
      rejectionReason: undefined,
      reviewedAt: reviewData?.reviewed_at || new Date().toISOString(),
    };

    return {
      profile: this.formatProfile(updatedProfile),
      review,
    };
  }

  /**
   * Reject Instructor Application:
   * status = 'inactive'
   * instructor_approval_status = 'rejected'
   */
  public async rejectInstructor(
    instructorId: string,
    reviewerId: string,
    rejectionReason?: string
  ): Promise<{ profile: UserProfile; review: InstructorApprovalReview }> {
    const currentProfile = await this.getUserById(instructorId);
    if (currentProfile.role !== 'instructor') {
      throw ApiError.badRequest('Selected user is not an instructor');
    }

    const previousStatus = currentProfile.instructorApprovalStatus || 'pending';

    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'inactive',
        instructor_approval_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructorId)
      .select()
      .single();

    if (profileError || !updatedProfile) {
      logger.error('Error rejecting instructor:', profileError);
      throw ApiError.badRequest('Failed to reject instructor');
    }

    // Sync rejection status to Supabase Auth metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(instructorId, {
        user_metadata: {
          ...currentProfile,
          instructor_approval_status: 'rejected',
          role: 'instructor',
        },
      });
    } catch (authSyncErr) {
      logger.warn('Non-blocking: could not sync rejection to auth.users:', authSyncErr);
    }

    // Insert audit review record
    const { data: reviewData } = await supabaseAdmin
      .from('instructor_approval_reviews')
      .insert({
        instructor_id: instructorId,
        reviewed_by: reviewerId,
        previous_status: previousStatus,
        new_status: 'rejected',
        rejection_reason: rejectionReason || 'Application rejected by administrator',
      })
      .select()
      .single();

    const review: InstructorApprovalReview = {
      id: reviewData?.id || 'rev-' + Date.now(),
      instructorId,
      reviewedBy: reviewerId,
      previousStatus,
      newStatus: 'rejected',
      rejectionReason: rejectionReason || 'Application rejected by administrator',
      reviewedAt: reviewData?.reviewed_at || new Date().toISOString(),
    };

    // Notify instructor in-app (non-blocking)
    NotificationService.notifyInstructorOfRejection(instructorId, rejectionReason).catch((err) => {
      logger.warn('Non-blocking: could not send rejection notification to instructor:', err);
    });

    return {
      profile: this.formatProfile(updatedProfile),
      review,
    };
  }

  /**
   * Create instructor account directly from Admin Panel
   */
  public async createInstructorDirectly(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    qualification: string;
    experience: string;
    specialization?: string;
    bio?: string;
  }): Promise<UserProfile> {
    const { fullName, email, password, phone, qualification, experience, specialization, bio } = input;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'instructor',
        phone,
        qualification,
        experience,
        specialization: specialization || qualification,
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      throw ApiError.badRequest(authError?.message || 'Failed to create instructor user');
    }

    const userId = authData.user.id;

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: 'instructor',
        status: 'active',
        instructor_approval_status: 'approved',
        phone,
        qualification,
        experience,
        specialization: specialization || qualification,
        bio: bio || `${qualification} instructor with ${experience} experience.`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError || !profileData) {
      logger.error('Error upserting direct instructor profile:', profileError);
      throw ApiError.internal('Failed to initialize instructor profile');
    }

    return this.formatProfile(profileData);
  }

  /**
   * Update instructor profile
   */
  public async updateInstructorProfile(userId: string, updateData: Partial<UserProfile>): Promise<UserProfile> {
    const fieldsToUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.fullName) fieldsToUpdate.full_name = updateData.fullName;
    if (updateData.phone !== undefined) fieldsToUpdate.phone = updateData.phone;
    if (updateData.qualification !== undefined) fieldsToUpdate.qualification = updateData.qualification;
    if (updateData.experience !== undefined) fieldsToUpdate.experience = updateData.experience;
    if (updateData.specialization !== undefined) fieldsToUpdate.specialization = updateData.specialization;
    if (updateData.bio !== undefined) fieldsToUpdate.bio = updateData.bio;
    if (updateData.status) fieldsToUpdate.status = updateData.status;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(fieldsToUpdate)
      .eq('id', userId)
      .eq('role', 'instructor')
      .select()
      .single();

    if (error || !data) {
      logger.error('Error updating instructor profile:', error);
      throw ApiError.badRequest('Failed to update instructor');
    }

    return this.formatProfile(data);
  }

  /**
   * Get approval review history for an instructor
   */
  public async getInstructorApprovalHistory(instructorId: string): Promise<InstructorApprovalReview[]> {
    const { data, error } = await supabaseAdmin
      .from('instructor_approval_reviews')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('reviewed_at', { ascending: false });

    if (error) {
      logger.error('Error fetching instructor approval history:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      instructorId: row.instructor_id,
      reviewedBy: row.reviewed_by,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      rejectionReason: row.rejection_reason,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    }));
  }

  /**
   * Delete user account (Admin only)
   */
  public async deleteUser(userId: string): Promise<void> {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      logger.error('Error deleting profile record:', profileError);
      throw ApiError.badRequest('Failed to delete profile record');
    }

    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
  }

  /**
   * Get High-Level Dashboard Statistics
   */
  public async getDashboardStats() {
    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: totalInstructors },
      { count: pendingInstructors },
      { count: approvedInstructors },
      { count: totalCourses },
      { count: publishedCourses },
      { count: pendingCourses },
      { count: totalEnrollments },
      { count: activeEnrollments },
      { count: completedEnrollments },
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('status', 'active'),
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor'),
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor')
        .eq('instructor_approval_status', 'pending'),
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor')
        .eq('instructor_approval_status', 'approved'),
      supabaseAdmin
        .from('courses')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('course_status', 'Published')
        .eq('approval_status', 'Approved'),
      supabaseAdmin
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'Pending Approval'),
      supabaseAdmin
        .from('enrollments')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active'),
      supabaseAdmin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Completed'),
    ]);

    return {
      students: {
        total: totalStudents || 0,
        active: activeStudents || 0,
        inactive: (totalStudents || 0) - (activeStudents || 0),
      },
      instructors: {
        total: totalInstructors || 0,
        pending: pendingInstructors || 0,
        approved: approvedInstructors || 0,
        active: approvedInstructors || 0,
      },
      courses: {
        total: totalCourses || 0,
        published: publishedCourses || 0,
        pending: pendingCourses || 0,
      },
      enrollments: {
        total: totalEnrollments || 0,
        active: activeEnrollments || 0,
        completed: completedEnrollments || 0,
      },
    };
  }

  /**
   * Get all verified certificates across the platform for Admin Certificate Management
   */
  public async getCertificates() {
    // 1. Fetch all enrollments with student profile and course info (scoped columns)
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        student_id,
        course_id,
        status,
        enrolled_at,
        completed_at,
        profiles!student_id(id, full_name, email, avatar_url, student_id_number),
        courses(id, title, category_id, duration_hours, instructor_id, categories(name))
      `)
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (error) {
      logger.error('Error fetching enrollments for admin certificates:', error);
      throw ApiError.internal(`Failed to fetch certificates: ${error.message}`);
    }

    const { progressService } = await import('./progress.service');

    const validEnrollments = (enrollments || []).filter(
      (enr: any) => enr.courses && (enr as any).profiles
    );

    if (validEnrollments.length === 0) {
      return {
        certificates: [],
        metrics: {
          totalCertificates: 0,
          certificatesIssued: 0,
          eligibleStudentsCount: 0,
        },
      };
    }

    // 2. Batch-fetch distinct instructor profiles in a single query
    const instructorIds = Array.from(
      new Set(validEnrollments.map((e: any) => e.courses?.instructor_id).filter(Boolean))
    );
    const { data: instructors } = instructorIds.length > 0
      ? await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, headline, qualification')
        .in('id', instructorIds)
      : { data: [] };
    const instructorMap = new Map<string, any>((instructors || []).map((i) => [i.id, i]));

    // 3. Batch-fetch progress only for enrolled students
    const studentIds = Array.from(new Set(validEnrollments.map((e: any) => e.student_id)));
    const studentProgressMaps = new Map<string, Record<string, any>>();

    await Promise.all(
      studentIds.map(async (sId) => {
        try {
          const pMap = await progressService.getStudentAllCoursesProgress(sId);
          studentProgressMaps.set(sId, pMap);
        } catch {
          // Ignore
        }
      })
    );

    // 4. Batch-fetch passed quiz attempts for all students
    const { data: passedAttempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('student_id, percentage, passed')
      .in('student_id', studentIds)
      .eq('passed', true);

    const quizScoreMap = new Map<string, number>();
    (passedAttempts || []).forEach((pa: any) => {
      const currentHighest = quizScoreMap.get(pa.student_id) || 0;
      const score = Math.round(Number(pa.percentage || 100));
      if (score > currentHighest) {
        quizScoreMap.set(pa.student_id, score);
      }
    });

    const certificatesList: any[] = [];
    let eligibleStudentsSet = new Set<string>();

    for (const enr of validEnrollments) {
      const course = enr.courses as any;
      const student = (enr as any).profiles;
      const instructorProfile = course.instructor_id ? instructorMap.get(course.instructor_id) : null;

      const pMap = studentProgressMaps.get(enr.student_id);
      const progressData = pMap ? pMap[enr.course_id] : null;
      if (!progressData) continue;

      const isCompleted = Boolean(progressData.isCourseCompleted || progressData.certificateAvailable);
      if (!isCompleted) continue;

      eligibleStudentsSet.add(enr.student_id);

      const completedDate = enr.completed_at ? new Date(enr.completed_at) : new Date();
      const issueYear = completedDate.getFullYear();
      const stableCertCode = `EDU-${issueYear}-${enr.course_id.slice(0, 4).toUpperCase()}-${enr.id.slice(0, 8).toUpperCase()}`;

      const quizScore = progressData.quizExists ? (quizScoreMap.get(enr.student_id) || 100) : 100;

      const formattedDate = completedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const categoryName = (course.categories as any)?.name || 'General';

      certificatesList.push({
        id: `cert-${enr.id}`,
        certificateNumber: stableCertCode,
        certificateCode: stableCertCode,
        serialCode: stableCertCode,
        studentId: student.student_id_number || student.id,
        studentProfileId: student.id,
        studentName: student.full_name || 'Student',
        studentEmail: student.email || '',
        studentAvatar: student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        courseId: enr.course_id,
        courseName: course.title || 'Course Masterclass',
        category: categoryName,
        instructorName: instructorProfile?.full_name || 'EduSphere Lead Instructor',
        instructorTitle: instructorProfile?.headline || instructorProfile?.qualification || 'Lead Instructor & Mentor',
        instructorAvatar: instructorProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        issueDate: formattedDate,
        completionDate: formattedDate,
        status: 'Issued',
        verificationHash: `SHA256:${Buffer.from(stableCertCode + ':' + student.id + ':' + enr.course_id).toString('hex').slice(0, 32)}`,
        lessonsCompleted: progressData.completedLessons,
        totalLessons: progressData.totalLessons,
        assignmentsCompleted: progressData.completedAssignmentsCount || progressData.passedAssignmentsCount || 0,
        totalAssignments: progressData.mandatoryAssignmentsCount,
        quizScore,
        learningHours: course.duration_hours || Math.round((progressData.totalLessons * 15) / 60) || 4,
      });
    }

    const totalCertificates = certificatesList.length;
    const certificatesIssued = certificatesList.filter((c) => c.status === 'Issued').length;
    const eligibleStudentsCount = eligibleStudentsSet.size;

    return {
      certificates: certificatesList,
      metrics: {
        totalCertificates,
        certificatesIssued,
        eligibleStudentsCount,
      },
    };
  }
}

export const adminService = new AdminService();

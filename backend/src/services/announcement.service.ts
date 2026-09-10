import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  AnnouncementItem,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementAudience,
  AnnouncementStatus,
  UserRole,
} from '../types';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

export class AnnouncementService {
  private static inMemoryAnnouncements: AnnouncementItem[] = [];
  private static inMemoryReads: { announcementId: string; userId: string; readAt: string }[] = [];

  /**
   * Format database row into standard AnnouncementItem
   */
  private static formatAnnouncement(row: any, isRead: boolean = false): AnnouncementItem {
    const creator = row.profiles;
    const course = row.courses;

    return {
      id: row.id,
      title: row.title,
      message: row.message,
      createdBy: row.created_by,
      creatorRole: row.creator_role,
      creatorName: creator?.full_name || row.creator_name || (row.creator_role === 'admin' ? 'EduSphere Admin' : 'Instructor'),
      creatorAvatar: creator?.avatar_url || row.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      audience: (row.audience as AnnouncementAudience) || 'Students',
      courseId: row.course_id || undefined,
      courseTitle: course?.title || row.course_title || undefined,
      status: (row.status as AnnouncementStatus) || 'Draft',
      publishedAt: row.published_at || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      isRead,
    };
  }

  /**
   * Create an announcement (Admin or Instructor)
   */
  public static async createAnnouncement(
    userId: string,
    userRole: UserRole,
    dto: CreateAnnouncementDto
  ): Promise<AnnouncementItem> {
    if (!dto.title?.trim() || !dto.message?.trim()) {
      throw new ApiError(400, 'Announcement title and message are required');
    }

    let audience: AnnouncementAudience = 'Students';
    let courseId: string | null = null;
    let courseTitle: string | undefined;

    // Role-specific validation
    if (userRole === 'admin') {
      audience = dto.audience || 'Students';
      if (!['Students', 'Instructors', 'Both Students & Instructors'].includes(audience)) {
        audience = 'Students';
      }
    } else if (userRole === 'instructor') {
      if (!dto.courseId) {
        throw new ApiError(400, 'Course ID is required for instructor announcements');
      }

      // Verify that the instructor actually owns this course
      const { data: courseData, error: courseErr } = await supabaseAdmin
        .from('courses')
        .select('id, title, instructor_id')
        .eq('id', dto.courseId)
        .single();

      if (courseErr || !courseData) {
        throw new ApiError(404, 'Selected course not found');
      }

      if (courseData.instructor_id !== userId) {
        throw new ApiError(403, 'You can only create announcements for courses you own');
      }

      courseId = dto.courseId;
      courseTitle = courseData.title;
      audience = 'Specific Course Students';
    } else {
      throw new ApiError(403, 'Students are not authorized to create announcements');
    }

    const isPublished = dto.status === 'Published';
    const now = new Date().toISOString();
    const newId = crypto.randomUUID();

    const row = {
      id: newId,
      title: dto.title.trim(),
      message: dto.message.trim(),
      created_by: userId,
      creator_role: userRole as 'admin' | 'instructor',
      audience,
      course_id: courseId,
      status: isPublished ? 'Published' : 'Draft',
      published_at: isPublished ? now : null,
      created_at: now,
      updated_at: now,
    };

    let createdItem: AnnouncementItem;

    try {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .insert(row)
        .select('*, profiles:created_by(full_name, avatar_url), courses:course_id(title)')
        .single();

      if (!error && data) {
        createdItem = this.formatAnnouncement(data, false);
      } else {
        createdItem = this.formatAnnouncement(
          { ...row, course_title: courseTitle, creator_name: userRole === 'admin' ? 'EduSphere Admin' : 'Course Instructor' },
          false
        );
      }
    } catch (err: any) {
      logger.warn(`Announcement DB insert fallback: ${err.message}`);
      createdItem = this.formatAnnouncement(
        { ...row, course_title: courseTitle, creator_name: userRole === 'admin' ? 'EduSphere Admin' : 'Course Instructor' },
        false
      );
    }

    this.inMemoryAnnouncements.push(createdItem);

    // If published immediately, dispatch notifications!
    if (isPublished) {
      await this.dispatchNotifications(createdItem, userId);
    }

    return createdItem;
  }

  /**
   * Update an existing announcement
   */
  public static async updateAnnouncement(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateAnnouncementDto
  ): Promise<AnnouncementItem> {
    const existing = await this.getAnnouncementRaw(id);
    if (!existing) {
      throw new ApiError(404, 'Announcement not found');
    }

    // Permission check
    if (userRole !== 'admin' && existing.createdBy !== userId) {
      throw new ApiError(403, 'You do not have permission to edit this announcement');
    }

    const wasDraft = existing.status === 'Draft';
    const isNowPublished = dto.status === 'Published';
    const transitionToPublished = wasDraft && isNowPublished;

    const now = new Date().toISOString();
    const updates: any = {
      updated_at: now,
    };

    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.message !== undefined) updates.message = dto.message.trim();
    if (dto.status !== undefined) updates.status = dto.status;

    if (transitionToPublished) {
      updates.published_at = now;
    }

    if (userRole === 'admin' && dto.audience) {
      updates.audience = dto.audience;
    }

    let updatedItem: AnnouncementItem;

    try {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select('*, profiles:created_by(full_name, avatar_url), courses:course_id(title)')
        .single();

      if (!error && data) {
        updatedItem = this.formatAnnouncement(data);
      } else {
        Object.assign(existing, updates);
        updatedItem = existing;
      }
    } catch {
      Object.assign(existing, updates);
      updatedItem = existing;
    }

    // Update in-memory cache
    const memIdx = this.inMemoryAnnouncements.findIndex((a) => a.id === id);
    if (memIdx !== -1) {
      this.inMemoryAnnouncements[memIdx] = updatedItem;
    }

    // If transitioned from Draft to Published, dispatch notifications!
    if (transitionToPublished) {
      await this.dispatchNotifications(updatedItem, userId);
    }

    return updatedItem;
  }

  /**
   * Delete an announcement
   */
  public static async deleteAnnouncement(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    const existing = await this.getAnnouncementRaw(id);
    if (!existing) {
      throw new ApiError(404, 'Announcement not found');
    }

    if (userRole !== 'admin' && existing.createdBy !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this announcement');
    }

    try {
      await supabaseAdmin.from('announcements').delete().eq('id', id);
    } catch (err: any) {
      logger.warn(`Announcement DB delete fallback: ${err.message}`);
    }

    this.inMemoryAnnouncements = this.inMemoryAnnouncements.filter((a) => a.id !== id);
    this.inMemoryReads = this.inMemoryReads.filter((r) => r.announcementId !== id);
    return true;
  }

  /**
   * Get announcement by ID
   */
  public static async getAnnouncementById(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<AnnouncementItem> {
    const item = await this.getAnnouncementRaw(id);
    if (!item) {
      throw new ApiError(404, 'Announcement not found');
    }

    // If student, check eligibility
    if (userRole === 'student') {
      if (item.status !== 'Published') {
        throw new ApiError(404, 'Announcement not found');
      }

      if (item.courseId) {
        const isEnrolled = await this.checkStudentEnrollment(userId, item.courseId);
        if (!isEnrolled) {
          throw new ApiError(403, 'You are not enrolled in this course');
        }
      }
    }

    const isRead = await this.checkIsRead(id, userId);
    item.isRead = isRead;
    return item;
  }

  /**
   * Get announcements feed based on user role and eligibility
   */
  public static async getAnnouncements(
    userId: string,
    userRole: UserRole,
    filters: { courseId?: string; status?: string; search?: string } = {}
  ): Promise<AnnouncementItem[]> {
    let list: AnnouncementItem[] = [];

    if (userRole === 'admin') {
      // Admin sees all announcements
      try {
        let query = supabaseAdmin
          .from('announcements')
          .select('*, profiles:created_by(full_name, avatar_url), courses:course_id(title)')
          .order('created_at', { ascending: false });

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          list = data.map((r) => this.formatAnnouncement(r));
        }
      } catch {}

      if (list.length === 0) {
        list = [...this.inMemoryAnnouncements];
      }
    } else if (userRole === 'instructor') {
      // Instructor sees only announcements created by them for their owned courses
      try {
        let query = supabaseAdmin
          .from('announcements')
          .select('*, profiles:created_by(full_name, avatar_url), courses:course_id(title)')
          .eq('created_by', userId)
          .order('created_at', { ascending: false });

        if (filters.courseId && filters.courseId !== 'all') {
          query = query.eq('course_id', filters.courseId);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          list = data.map((r) => this.formatAnnouncement(r));
        }
      } catch {}

      if (list.length === 0) {
        list = this.inMemoryAnnouncements.filter((a) => a.createdBy === userId);
      }
    } else {
      // Student: Platform announcements ('Students', 'Both') + Active enrolled course announcements
      const enrolledCourseIds = await this.getStudentActiveCourseIds(userId);

      try {
        // Query published platform announcements OR published announcements for enrolled courses
        const { data, error } = await supabaseAdmin
          .from('announcements')
          .select('*, profiles:created_by(full_name, avatar_url), courses:course_id(title)')
          .eq('status', 'Published')
          .order('published_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          list = data
            .map((r) => this.formatAnnouncement(r))
            .filter((a) => {
              if (a.audience === 'Students' || a.audience === 'Both Students & Instructors') {
                return !a.courseId;
              }
              if (a.courseId) {
                return enrolledCourseIds.includes(a.courseId);
              }
              return false;
            });
        }
      } catch {}

      if (list.length === 0) {
        list = this.inMemoryAnnouncements
          .filter((a) => a.status === 'Published')
          .filter((a) => {
            if (a.audience === 'Students' || a.audience === 'Both Students & Instructors') {
              return !a.courseId;
            }
            if (a.courseId) {
              return enrolledCourseIds.includes(a.courseId);
            }
            return false;
          });
      }
    }

    // Attach read state for user
    const readMap = await this.getUserReadMap(userId);
    list.forEach((item) => {
      item.isRead = readMap.has(item.id);
    });

    // Apply search filter if provided
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          (a.courseTitle && a.courseTitle.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * Mark announcement as read for a user
   */
  public static async markAsRead(announcementId: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();

    try {
      await supabaseAdmin.from('announcement_reads').upsert(
        {
          announcement_id: announcementId,
          user_id: userId,
          read_at: now,
        },
        { onConflict: 'announcement_id,user_id' }
      );
    } catch (err: any) {
      logger.warn(`Announcement read upsert fallback: ${err.message}`);
    }

    const existingIdx = this.inMemoryReads.findIndex(
      (r) => r.announcementId === announcementId && r.userId === userId
    );
    if (existingIdx === -1) {
      this.inMemoryReads.push({ announcementId, userId, readAt: now });
    }

    return true;
  }

  /**
   * Dispatch notifications to eligible recipients when an announcement is published
   */
  private static async dispatchNotifications(
    announcement: AnnouncementItem,
    creatorUserId: string
  ): Promise<void> {
    let recipientIds: string[] = [];

    try {
      if (announcement.audience === 'Students') {
        const { data } = await supabaseAdmin.from('profiles').select('id').eq('role', 'student');
        if (Array.isArray(data)) recipientIds = data.map((u) => u.id);
      } else if (announcement.audience === 'Instructors') {
        const { data } = await supabaseAdmin.from('profiles').select('id').eq('role', 'instructor');
        if (Array.isArray(data)) recipientIds = data.map((u) => u.id);
      } else if (announcement.audience === 'Both Students & Instructors') {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .in('role', ['student', 'instructor']);
        if (Array.isArray(data)) recipientIds = data.map((u) => u.id);
      } else if (announcement.courseId) {
        // Enrolled active students for this course
        const { data } = await supabaseAdmin
          .from('enrollments')
          .select('student_id')
          .eq('course_id', announcement.courseId)
          .eq('status', 'Active');
        if (Array.isArray(data)) recipientIds = data.map((e) => e.student_id);
      }
    } catch (err: any) {
      logger.warn(`Failed recipient query for announcement dispatch: ${err.message}`);
    }

    // Exclude the creator from receiving their own notification
    recipientIds = recipientIds.filter((id) => id !== creatorUserId);

    if (recipientIds.length > 0) {
      await NotificationService.createAnnouncementNotifications(
        {
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          creatorRole: announcement.creatorRole,
          courseTitle: announcement.courseTitle,
        },
        recipientIds
      );
    }
  }

  // --- Helper Methods ---

  private static async getAnnouncementRaw(id: string): Promise<AnnouncementItem | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*, profiles:created_by(full_name, avatar_url), courses:course_id(title)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return this.formatAnnouncement(data);
      }
    } catch {}

    const mem = this.inMemoryAnnouncements.find((a) => a.id === id);
    return mem ? { ...mem } : null;
  }

  private static async getStudentActiveCourseIds(studentId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'Active');

      if (!error && Array.isArray(data)) {
        return data.map((e) => e.course_id);
      }
    } catch {}

    return [];
  }

  private static async checkStudentEnrollment(studentId: string, courseId: string): Promise<boolean> {
    try {
      const { count, error } = await supabaseAdmin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('status', 'Active');

      if (!error && count !== null) {
        return count > 0;
      }
    } catch {}

    return false;
  }

  private static async checkIsRead(announcementId: string, userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabaseAdmin
        .from('announcement_reads')
        .select('id', { count: 'exact', head: true })
        .eq('announcement_id', announcementId)
        .eq('user_id', userId);

      if (!error && count !== null) {
        return count > 0;
      }
    } catch {}

    return this.inMemoryReads.some(
      (r) => r.announcementId === announcementId && r.userId === userId
    );
  }

  private static async getUserReadMap(userId: string): Promise<Set<string>> {
    const set = new Set<string>();

    try {
      const { data, error } = await supabaseAdmin
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', userId);

      if (!error && Array.isArray(data)) {
        data.forEach((r) => set.add(r.announcement_id));
      }
    } catch {}

    this.inMemoryReads.filter((r) => r.userId === userId).forEach((r) => set.add(r.announcementId));
    return set;
  }
}

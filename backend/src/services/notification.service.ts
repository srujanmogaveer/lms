import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { NotificationItem, NotificationCategory, NotificationType } from '../types';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';

export class NotificationService {
  // In-memory runtime cache for resilience
  private static inMemoryNotifications: NotificationItem[] = [];

  /**
   * Format DB notification row into standard NotificationItem
   */
  private static formatNotification(row: any): NotificationItem {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: (row.type as NotificationType) || 'info',
      category: (row.category as NotificationCategory) || 'announcement',
      isRead: Boolean(row.is_read),
      actionUrl: row.action_url || undefined,
      sourceId: row.source_id || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Get notifications for a user with unread count
   */
  public static async getNotifications(userId: string, limit: number = 50): Promise<{
    notifications: NotificationItem[];
    unreadCount: number;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        const notifications = data.map(this.formatNotification);
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return { notifications, unreadCount };
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch notifications from Supabase: ${err.message}`);
    }

    // Fallback to in-memory store
    const userNotifs = this.inMemoryNotifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    const unreadCount = userNotifs.filter((n) => !n.isRead).length;
    return { notifications: userNotifs, unreadCount };
  }

  /**
   * Get unread notification count only
   */
  public static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error && count !== null) {
        return count;
      }
    } catch (err: any) {
      logger.warn(`Failed to count unread notifications from Supabase: ${err.message}`);
    }

    return this.inMemoryNotifications.filter((n) => n.userId === userId && !n.isRead).length;
  }

  /**
   * Mark a single notification as read
   */
  public static async markAsRead(notificationId: string, userId: string): Promise<NotificationItem> {
    const now = new Date().toISOString();

    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, updated_at: now })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (!error && data) {
        return this.formatNotification(data);
      }
    } catch (err: any) {
      logger.warn(`Failed to mark notification read in Supabase: ${err.message}`);
    }

    // Update in memory
    const existing = this.inMemoryNotifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!existing) {
      throw new ApiError(404, 'Notification not found');
    }

    existing.isRead = true;
    existing.updatedAt = now;
    return existing;
  }

  /**
   * Mark all notifications as read for a user
   */
  public static async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const now = new Date().toISOString();

    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, updated_at: now })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        return { success: true, count: 0 };
      }
    } catch (err: any) {
      logger.warn(`Failed to mark all read in Supabase: ${err.message}`);
    }

    let count = 0;
    this.inMemoryNotifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.updatedAt = now;
        count++;
      }
    });

    return { success: true, count };
  }

  /**
   * Delete a notification
   */
  public static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (!error) {
        return true;
      }
    } catch (err: any) {
      logger.warn(`Failed to delete notification in Supabase: ${err.message}`);
    }

    const idx = this.inMemoryNotifications.findIndex((n) => n.id === notificationId && n.userId === userId);
    if (idx !== -1) {
      this.inMemoryNotifications.splice(idx, 1);
      return true;
    }

    return true;
  }

  /**
   * Create a single notification
   */
  public static async createNotification(item: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    category?: NotificationCategory;
    actionUrl?: string;
    sourceId?: string;
  }): Promise<NotificationItem> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    const notifRow = {
      id: newId,
      user_id: item.userId,
      title: item.title,
      message: item.message,
      type: item.type || 'info',
      category: item.category || 'announcement',
      is_read: false,
      action_url: item.actionUrl || null,
      source_id: item.sourceId || null,
      created_at: now,
      updated_at: now,
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifRow)
        .select()
        .single();

      if (!error && data) {
        return this.formatNotification(data);
      }
    } catch (err: any) {
      logger.warn(`Failed to insert notification into Supabase: ${err.message}`);
    }

    const memoryItem = this.formatNotification(notifRow);
    this.inMemoryNotifications.push(memoryItem);
    return memoryItem;
  }

  /**
   * Create multiple notifications in bulk
   */
  public static async createBulkNotifications(items: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    category?: NotificationCategory;
    actionUrl?: string;
    sourceId?: string;
  }[]): Promise<NotificationItem[]> {
    if (!items || items.length === 0) return [];
    const now = new Date().toISOString();

    const notifRows = items.map((item) => ({
      id: crypto.randomUUID(),
      user_id: item.userId,
      title: item.title,
      message: item.message,
      type: item.type || 'info',
      category: item.category || 'system',
      is_read: false,
      action_url: item.actionUrl || null,
      source_id: item.sourceId || null,
      created_at: now,
      updated_at: now,
    }));

    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifRows)
        .select();

      if (!error && Array.isArray(data)) {
        return data.map((d) => this.formatNotification(d));
      }
    } catch (err: any) {
      logger.warn(`Failed to bulk insert notifications in Supabase: ${err.message}`);
    }

    const formattedList = notifRows.map((r) => this.formatNotification(r));
    formattedList.forEach((n) => this.inMemoryNotifications.push(n));
    return formattedList;
  }

  /**
   * Idempotently create batch notifications for an announcement
   * Ensures ONE notification per (user_id, announcement.id)
   */
  public static async createAnnouncementNotifications(
    announcement: {
      id: string;
      title: string;
      message: string;
      creatorRole: string;
      courseTitle?: string;
    },
    recipientUserIds: string[]
  ): Promise<number> {
    if (!recipientUserIds || recipientUserIds.length === 0) {
      return 0;
    }

    // Deduplicate recipient IDs
    const uniqueRecipientIds = Array.from(new Set(recipientUserIds));
    const now = new Date().toISOString();

    // Prepare notification records
    const title = announcement.courseTitle
      ? `New Course Announcement: ${announcement.title}`
      : `Platform Announcement: ${announcement.title}`;

    const shortMessage =
      announcement.message.length > 140
        ? `${announcement.message.substring(0, 137)}...`
        : announcement.message;

    // Check existing notifications for this source_id to guarantee idempotency
    let existingUserIds = new Set<string>();

    try {
      const { data: existingRows } = await supabaseAdmin
        .from('notifications')
        .select('user_id')
        .eq('category', 'announcement')
        .eq('source_id', announcement.id);

      if (Array.isArray(existingRows)) {
        existingRows.forEach((r) => existingUserIds.add(r.user_id));
      }
    } catch {
      // Memory check
      this.inMemoryNotifications
        .filter((n) => n.category === 'announcement' && n.sourceId === announcement.id)
        .forEach((n) => existingUserIds.add(n.userId));
    }

    const filteredRecipients = uniqueRecipientIds.filter((uid) => !existingUserIds.has(uid));
    if (filteredRecipients.length === 0) {
      return 0;
    }

    const newRows = filteredRecipients.map((userId) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      message: shortMessage,
      type: 'info',
      category: 'announcement',
      is_read: false,
      action_url: '/student/announcements',
      source_id: announcement.id,
      created_at: now,
      updated_at: now,
    }));

    try {
      const { error } = await supabaseAdmin.from('notifications').insert(newRows);
      if (!error) {
        logger.info(`Inserted ${newRows.length} announcement notifications successfully.`);
        return newRows.length;
      }
    } catch (err: any) {
      logger.warn(`Failed bulk insert into Supabase notifications: ${err.message}`);
    }

    // Fallback to in-memory store
    newRows.forEach((row) => {
      this.inMemoryNotifications.push(this.formatNotification(row));
    });

    return newRows.length;
  }

  /**
   * Broadcast custom notification from Admin Studio
   */
  public static async broadcastAdminNotification(dto: {
    title: string;
    message: string;
    audience: 'all' | 'students' | 'instructors' | 'specific';
    priority?: 'info' | 'success' | 'warning' | 'error';
    category?: NotificationCategory;
    targetUserIds?: string[];
    actionUrl?: string;
  }): Promise<{ recipientCount: number; message: string }> {
    let recipientIds: string[] = [];

    if (dto.audience === 'specific' && Array.isArray(dto.targetUserIds) && dto.targetUserIds.length > 0) {
      recipientIds = dto.targetUserIds;
    } else {
      let query = supabaseAdmin.from('profiles').select('id, role');

      if (dto.audience === 'students') {
        query = query.eq('role', 'student');
      } else if (dto.audience === 'instructors') {
        query = query.eq('role', 'instructor');
      }

      const { data: users, error } = await query;
      if (error) {
        logger.error('Error fetching broadcast audience:', error);
        throw ApiError.internal('Failed to resolve broadcast recipients');
      }

      recipientIds = (users || []).map((u) => u.id);
    }

    if (recipientIds.length === 0) {
      return { recipientCount: 0, message: 'No recipients found for the selected audience.' };
    }

    const notifications = recipientIds.map((userId) => ({
      userId,
      title: dto.title.trim(),
      message: dto.message.trim(),
      type: dto.priority || 'info',
      category: dto.category || 'system',
      actionUrl: dto.actionUrl?.trim() || undefined,
      sourceId: `broadcast-${Date.now()}`,
    }));

    const inserted = await this.createBulkNotifications(notifications);

    return {
      recipientCount: inserted.length,
      message: `Notification broadcast sent to ${inserted.length} users successfully.`,
    };
  }

  /**
   * Get all notifications across system for Admin overview
   */
  public static async getAllSystemNotifications(limit: number = 100): Promise<NotificationItem[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return data.map(this.formatNotification);
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch all system notifications from Supabase: ${err.message}`);
    }

    return this.inMemoryNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Notify all administrators when a new instructor registers
   */
  public static async notifyAdminsOfNewInstructor(instructor: {
    id: string;
    fullName: string;
    email: string;
    specialization?: string;
  }): Promise<void> {
    try {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      let adminIds = (admins || []).map((a) => a.id);

      // Fallback: If no profiles with role 'admin' found, query auth.users list
      if (adminIds.length === 0) {
        try {
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const fallbackAdmins = (userList?.users || []).filter(
            (u) =>
              u.user_metadata?.role === 'admin' ||
              u.email?.toLowerCase().includes('admin') ||
              u.email === 'srujan2.mca.2024@pim.ac.in'
          );
          adminIds = fallbackAdmins.map((u) => u.id);
        } catch (listErr) {
          logger.warn('Could not query auth.admin.listUsers for admin fallback:', listErr);
        }
      }

      if (adminIds.length === 0) {
        logger.warn('No administrators found to notify for new instructor registration');
        return;
      }

      const notifs = adminIds.map((adminId) => ({
        userId: adminId,
        title: 'New Instructor Application',
        message: `${instructor.fullName} (${instructor.email}) has registered and submitted an application for review.${
          instructor.specialization ? ` Specialization: ${instructor.specialization}.` : ''
        }`,
        type: 'warning' as const,
        category: 'system' as const,
        actionUrl: '/admin/instructors',
        sourceId: `instructor-reg-${instructor.id}`,
      }));

      await this.createBulkNotifications(notifs);
      logger.info(`Notified ${adminIds.length} administrators of new instructor application (${instructor.fullName})`);
    } catch (err: any) {
      logger.error('Failed to notify admins of new instructor registration:', err);
    }
  }

  /**
   * Notify instructor when their application is approved
   */
  public static async notifyInstructorOfApproval(instructorId: string): Promise<void> {
    try {
      // 1. In-App Notification
      await this.createNotification({
        userId: instructorId,
        title: 'Instructor Application Approved! 🎉',
        message: 'Congratulations! Your instructor application has been approved by the administration. You can now access your studio, create, and publish courses.',
        type: 'success',
        category: 'system',
        actionUrl: '/instructor',
        sourceId: `approval-${instructorId}`,
      });

      // 2. Email Notification (via Gmail SMTP / Resend)
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', instructorId)
          .single();

        if (profile?.email) {
          EmailService.sendInstructorApprovalEmail({
            to: profile.email,
            fullName: profile.full_name || 'Instructor',
          }).catch((emailErr) => {
            logger.warn(`Non-blocking: could not dispatch approval email to ${profile.email}:`, emailErr);
          });
        }
      } catch (profileErr) {
        logger.warn(`Could not lookup instructor email for approval notification: ${instructorId}`, profileErr);
      }
    } catch (err: any) {
      logger.warn(`Failed to send approval notification to instructor ${instructorId}:`, err);
    }
  }

  /**
   * Notify instructor when their application is rejected
   */
  public static async notifyInstructorOfRejection(instructorId: string, reason?: string): Promise<void> {
    try {
      // 1. In-App Notification
      await this.createNotification({
        userId: instructorId,
        title: 'Instructor Application Status Update',
        message: reason
          ? `Your instructor application was not approved. Reason: ${reason}`
          : 'Your instructor application was not approved at this time. Please contact support for more details.',
        type: 'error',
        category: 'system',
        actionUrl: '/auth/instructor-login',
        sourceId: `rejection-${instructorId}`,
      });

      // 2. Email Notification
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', instructorId)
          .single();

        if (profile?.email) {
          EmailService.sendInstructorRejectionEmail({
            to: profile.email,
            fullName: profile.full_name || 'Instructor',
            reason,
          }).catch((emailErr) => {
            logger.warn(`Non-blocking: could not dispatch rejection email to ${profile.email}:`, emailErr);
          });
        }
      } catch (profileErr) {
        logger.warn(`Could not lookup instructor email for rejection notification: ${instructorId}`, profileErr);
      }
    } catch (err: any) {
      logger.warn(`Failed to send rejection notification to instructor ${instructorId}:`, err);
    }
  }
}



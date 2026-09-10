import { api } from './apiClient';
import type { NotificationItem } from '../types';

export const notificationService = {
  /**
   * Get user's notifications and unread count
   */
  async getNotifications(limit: number = 50): Promise<{
    notifications: NotificationItem[];
    unreadCount: number;
  }> {
    const res = await api.get<{
      notifications: NotificationItem[];
      unreadCount: number;
    }>(`/notifications?limit=${limit}`);

    const rawList = res.data?.notifications || [];
    const unreadCount = res.data?.unreadCount ?? rawList.filter((n) => !n.isRead && !n.read).length;

    const formatted = rawList.map((n) => {
      const createdDate = n.createdAt ? new Date(n.createdAt) : new Date();
      return {
        ...n,
        read: n.isRead ?? n.read ?? false,
        timestamp: formatRelativeTime(createdDate),
        date: createdDate.toISOString().split('T')[0],
        time: createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    return { notifications: formatted, unreadCount };
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data?.unreadCount || 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data!;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    const res = await api.patch<{ success: boolean; count: number }>('/notifications/mark-all-read');
    return res.data!;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    await api.delete(`/notifications/${id}`);
    return true;
  },

  /**
   * Admin broadcast a custom notification to audience
   */
  async broadcastNotification(payload: {
    title: string;
    message: string;
    audience: 'all' | 'students' | 'instructors' | 'specific';
    priority?: 'info' | 'success' | 'warning' | 'error';
    category?: string;
    targetUserIds?: string[];
    actionUrl?: string;
  }): Promise<{ recipientCount: number; message: string }> {
    const res = await api.post<{ recipientCount: number; message: string }>('/notifications/broadcast', payload);
    return res.data!;
  },

  /**
   * Admin get all system notifications
   */
  async getAllSystemNotifications(limit: number = 100): Promise<NotificationItem[]> {
    const res = await api.get<NotificationItem[]>(`/notifications/admin/all?limit=${limit}`);
    return res.data || [];
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

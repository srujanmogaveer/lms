import { api } from './apiClient';
import type {
  AnnouncementItem,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '../types';

export const announcementService = {
  /**
   * Get announcements list (filtered by role on backend)
   */
  async getAnnouncements(filters?: {
    courseId?: string;
    status?: string;
    search?: string;
  }): Promise<AnnouncementItem[]> {
    const params = new URLSearchParams();
    if (filters?.courseId && filters.courseId !== 'all') {
      params.append('courseId', filters.courseId);
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.search?.trim()) {
      params.append('search', filters.search.trim());
    }

    const queryStr = params.toString();
    const endpoint = `/announcements${queryStr ? `?${queryStr}` : ''}`;
    const res = await api.get<AnnouncementItem[]>(endpoint);
    const list = res.data || [];

    // Ensure backwards compatible fields for display
    return list.map((a) => ({
      ...a,
      content: a.content || a.message,
      summary: a.summary || (a.message ? a.message.substring(0, 120) : ''),
      authorName: a.authorName || a.creatorName || (a.creatorRole === 'admin' ? 'EduSphere Admin' : 'Course Instructor'),
      authorRole: a.authorRole || a.creatorRole,
      authorAvatar: a.authorAvatar || a.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      date: a.publishedAt
        ? new Date(a.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : new Date(a.createdAt || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) + ' (Draft)',
    }));
  },

  /**
   * Get single announcement by ID
   */
  async getAnnouncementById(id: string): Promise<AnnouncementItem> {
    const res = await api.get<AnnouncementItem>(`/announcements/${id}`);
    const a = res.data!;
    return {
      ...a,
      content: a.content || a.message,
      summary: a.summary || (a.message ? a.message.substring(0, 120) : ''),
      authorName: a.authorName || a.creatorName || (a.creatorRole === 'admin' ? 'EduSphere Admin' : 'Course Instructor'),
      authorRole: a.authorRole || a.creatorRole,
      authorAvatar: a.authorAvatar || a.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      date: a.publishedAt
        ? new Date(a.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Draft',
    };
  },

  /**
   * Create new announcement
   */
  async createAnnouncement(dto: CreateAnnouncementDto): Promise<AnnouncementItem> {
    const res = await api.post<AnnouncementItem>('/announcements', dto);
    return res.data!;
  },

  /**
   * Update announcement
   */
  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto): Promise<AnnouncementItem> {
    const res = await api.put<AnnouncementItem>(`/announcements/${id}`, dto);
    return res.data!;
  },

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: string): Promise<boolean> {
    await api.delete(`/announcements/${id}`);
    return true;
  },

  /**
   * Mark announcement as read
   */
  async markAsRead(id: string): Promise<boolean> {
    await api.post(`/announcements/${id}/read`);
    return true;
  },
};

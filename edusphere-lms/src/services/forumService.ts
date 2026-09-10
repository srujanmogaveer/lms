import { api } from './apiClient';
import { supabase } from '../lib/supabase';
import type {
  StudentForumDiscussion,
  ForumReply,
  ForumModerationReport,
} from '../types';

export interface ForumFilters {
  courseId?: string;
  category?: string;
  status?: string; // 'all' | 'unanswered' | 'answered' | 'solved' | 'pinned' | 'my'
  search?: string;
  sortBy?: string; // 'latest' | 'popular' | 'oldest'
  page?: number;
  limit?: number;
}

export interface ForumStats {
  total: number;
  unanswered: number;
  answered: number;
  solved: number;
  pinned: number;
}

export interface PaginatedDiscussionsResponse {
  discussions: StudentForumDiscussion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: ForumStats;
}

export const forumService = {
  /**
   * Get paginated discussions list
   */
  async getDiscussions(filters?: ForumFilters): Promise<PaginatedDiscussionsResponse> {
    const params = new URLSearchParams();
    if (filters?.courseId && filters.courseId !== 'all') {
      params.append('courseId', filters.courseId);
    }
    if (filters?.category && filters.category !== 'All Categories') {
      params.append('category', filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.search?.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters?.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }

    const queryStr = params.toString();
    const endpoint = `/forum/discussions${queryStr ? `?${queryStr}` : ''}`;
    const res = await api.get<StudentForumDiscussion[]>(endpoint);

    const rawList = res.data || [];
    const discussions: StudentForumDiscussion[] = rawList.map((d: any) => ({
      ...d,
      replies: d.replies || [],
      attachments: d.attachments || [],
    }));

    const pagination = (res as any).pagination || {
      total: discussions.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    return {
      discussions,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      stats: (res as any).meta?.stats,
    };
  },

  /**
   * Get single discussion details with replies
   */
  async getDiscussionDetails(id: string): Promise<StudentForumDiscussion> {
    const res = await api.get<StudentForumDiscussion>(`/forum/discussions/${id}`);
    const d = res.data;
    if (!d) {
      throw new Error(res.message || 'Discussion not found');
    }
    return {
      ...d,
      replies: d.replies || [],
      attachments: d.attachments || [],
    };
  },

  /**
   * Create a new discussion thread
   */
  async createDiscussion(data: {
    courseId: string;
    category: StudentForumDiscussion['category'];
    title: string;
    content: string;
    attachments?: Array<{ name: string; size: string; type: any; url: string }>;
  }): Promise<StudentForumDiscussion> {
    const res = await api.post<StudentForumDiscussion>('/forum/discussions', data);
    if (!res.data) {
      throw new Error(res.message || 'Failed to create discussion');
    }
    return res.data;
  },

  /**
   * Update discussion thread (Author or Admin)
   */
  async updateDiscussion(
    id: string,
    data: { title?: string; content?: string; category?: StudentForumDiscussion['category'] }
  ): Promise<StudentForumDiscussion> {
    const res = await api.patch<StudentForumDiscussion>(`/forum/discussions/${id}`, data);
    if (!res.data) {
      throw new Error(res.message || 'Failed to update discussion');
    }
    return res.data;
  },

  /**
   * Delete discussion thread
   */
  async deleteDiscussion(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/forum/discussions/${id}`);
    return res.data || { success: res.success, message: res.message };
  },

  /**
   * Post a reply
   */
  async createReply(
    discussionId: string,
    data: { content: string; attachments?: Array<{ name: string; size: string; type: any; url: string }> }
  ): Promise<ForumReply> {
    const res = await api.post<ForumReply>(`/forum/discussions/${discussionId}/replies`, data);
    if (!res.data) {
      throw new Error(res.message || 'Failed to post reply');
    }
    return res.data;
  },

  /**
   * Update reply (Author or Admin)
   */
  async updateReply(replyId: string, data: { content: string }): Promise<ForumReply> {
    const res = await api.patch<ForumReply>(`/forum/replies/${replyId}`, data);
    if (!res.data) {
      throw new Error(res.message || 'Failed to update reply');
    }
    return res.data;
  },

  /**
   * Delete reply
   */
  async deleteReply(replyId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/forum/replies/${replyId}`);
    return res.data || { success: res.success, message: res.message };
  },

  /**
   * Toggle reaction (Like / Unlike) on discussion or reply
   */
  async toggleReaction(
    targetType: 'discussion' | 'reply',
    targetId: string
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    const res = await api.post<{ isLiked: boolean; likesCount: number }>('/forum/react', {
      targetType,
      targetId,
    });
    return res.data || { isLiked: false, likesCount: 0 };
  },

  /**
   * Moderate discussion (Pin, Solve, Lock) - Instructor or Admin
   */
  async moderateDiscussion(
    discussionId: string,
    data: { isPinned?: boolean; isSolved?: boolean; isLocked?: boolean }
  ): Promise<StudentForumDiscussion> {
    const res = await api.patch<StudentForumDiscussion>(`/forum/discussions/${discussionId}/moderate`, data);
    if (!res.data) {
      throw new Error(res.message || 'Failed to moderate discussion');
    }
    return res.data;
  },

  /**
   * Moderate reply (Pin, Accepted Answer) - Instructor or Admin
   */
  async moderateReply(
    replyId: string,
    data: { isPinned?: boolean; isAcceptedAnswer?: boolean }
  ): Promise<ForumReply> {
    const res = await api.patch<ForumReply>(`/forum/replies/${replyId}/moderate`, data);
    if (!res.data) {
      throw new Error(res.message || 'Failed to moderate reply');
    }
    return res.data;
  },

  /**
   * Create moderation report
   */
  async createReport(data: {
    targetType: 'discussion' | 'reply';
    targetId: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>('/forum/reports', data);
    return res.data || { success: res.success, message: res.message };
  },

  /**
   * Get moderation reports (Instructor or Admin)
   */
  async getReports(status?: string): Promise<ForumModerationReport[]> {
    const endpoint = `/forum/reports${status && status !== 'all' ? `?status=${status}` : ''}`;
    const res = await api.get<ForumModerationReport[]>(endpoint);
    return res.data || [];
  },

  /**
   * Resolve moderation report (Instructor or Admin)
   */
  async resolveReport(
    reportId: string,
    data: { status: 'Reviewed' | 'Dismissed' | 'Actioned'; resolutionNotes?: string }
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.patch<{ success: boolean; message: string }>(`/forum/reports/${reportId}/resolve`, data);
    return res.data || { success: res.success, message: res.message };
  },

  /**
   * Subscribe to Supabase Realtime changes for low egress
   * Scoped to specific course or global, with full cleanup
   */
  subscribeToForumChanges(
    courseId: string | null,
    onDiscussionChange: (payload: any) => void,
    onReplyChange: (payload: any) => void
  ): () => void {
    const channelName = courseId ? `forum-course-${courseId}` : `forum-global-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Discussion listener
    channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'course_discussions',
        filter: courseId ? `course_id=eq.${courseId}` : undefined,
      },
      (payload: any) => {
        onDiscussionChange(payload);
      }
    );

    // Reply listener
    channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'discussion_replies',
      },
      (payload: any) => {
        onReplyChange(payload);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

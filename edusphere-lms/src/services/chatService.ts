import { api } from './apiClient';
import type { ChatConversation, ChatMessage, ChatAttachment } from '../types';

export interface CreateConversationDto {
  recipientId: string;
  courseId?: string;
  type?: 'student_instructor' | 'admin_instructor';
}

export interface SendMessagePayload {
  content: string;
  type?: 'text' | 'image' | 'file' | 'link';
  attachments?: ChatAttachment[];
}

/**
 * Safely upsert a single message into a message list without duplicates
 */
export function upsertMessage<T extends { id: string }>(
  existingList: T[],
  incomingMessage: T
): T[] {
  const index = existingList.findIndex((m) => m.id === incomingMessage.id);
  if (index !== -1) {
    const copy = [...existingList];
    copy[index] = incomingMessage;
    return copy;
  }
  return [...existingList, incomingMessage];
}

/**
 * Safely merge two message lists by unique message ID
 */
export function mergeUniqueMessages<T extends { id: string }>(
  existingList: T[],
  incomingList: T[]
): T[] {
  const map = new Map<string, T>();
  for (const m of existingList) {
    map.set(m.id, m);
  }
  for (const m of incomingList) {
    map.set(m.id, m);
  }
  return Array.from(map.values());
}

export const chatService = {
  /**
   * List all conversations for the authenticated user
   */
  async getConversations(): Promise<ChatConversation[]> {
    const res = await api.get<any[]>('/chat/conversations');
    const rows = res.data || [];

    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      courseId: r.courseId || '',
      courseTitle: r.courseTitle || 'Course Mentorship',
      studentId: r.studentId,
      instructorId: r.instructorId || r.participant?.userId || '',
      adminId: r.adminId,
      instructorName: r.instructor?.name || r.participant?.name || 'Instructor',
      instructorAvatar: r.instructor?.avatar || r.participant?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      instructorRole: r.instructor?.role || r.participant?.headline || 'Course Instructor',
      instructorStatus: r.instructor?.status || r.participant?.onlineStatus || 'online',
      instructorBio: r.instructor?.bio,
      instructorEmail: r.instructor?.email || r.participant?.email,
      officeHours: r.instructor?.officeHours || 'Mon & Wed: 4:00 PM - 6:00 PM',
      participant: r.participant,
      lastMessage: r.lastMessage || '',
      lastMessageTime: r.lastMessageTime || '',
      unreadCount: r.unreadCount || 0,
      messages: [],
    }));
  },

  /**
   * Get or create a conversation (Enforcing Student ↔ Instructor and Admin ↔ Instructor uniqueness)
   */
  async getOrCreateConversation(dto: CreateConversationDto): Promise<ChatConversation> {
    const res = await api.post<any>('/chat/conversations', dto);
    const r = res.data;

    return {
      id: r.id,
      type: r.type,
      courseId: r.courseId || '',
      courseTitle: r.courseTitle || 'Course Mentorship',
      studentId: r.studentId,
      instructorId: r.instructorId || r.participant?.userId || '',
      adminId: r.adminId,
      instructorName: r.instructor?.name || r.participant?.name || 'Instructor',
      instructorAvatar: r.instructor?.avatar || r.participant?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      instructorRole: r.instructor?.role || r.participant?.headline || 'Course Instructor',
      instructorStatus: r.instructor?.status || r.participant?.onlineStatus || 'online',
      instructorBio: r.instructor?.bio,
      instructorEmail: r.instructor?.email || r.participant?.email,
      officeHours: r.instructor?.officeHours || 'Mon & Wed: 4:00 PM - 6:00 PM',
      participant: r.participant,
      lastMessage: r.lastMessage || '',
      lastMessageTime: r.lastMessageTime || '',
      unreadCount: r.unreadCount || 0,
      messages: [],
    };
  },

  /**
   * Fetch paginated messages for a conversation
   */
  async getMessages(conversationId: string, before?: string): Promise<ChatMessage[]> {
    const res = await api.get<any[]>(`/chat/conversations/${conversationId}/messages`, { before });
    const rows = res.data || [];

    return rows.map((m: any) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.senderName,
      senderAvatar: m.senderAvatar,
      senderRole: m.senderRole,
      content: m.content,
      type: m.type || 'text',
      timestamp: m.timestamp,
      date: m.date || 'Today',
      isRead: m.isRead,
      attachments: m.attachments || [],
    }));
  },

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<ChatMessage> {
    const res = await api.post<any>(`/chat/conversations/${conversationId}/messages`, payload);
    const m = res.data;

    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.senderName,
      senderAvatar: m.senderAvatar,
      senderRole: m.senderRole,
      content: m.content,
      type: m.type || 'text',
      timestamp: m.timestamp,
      date: m.date || 'Today',
      isRead: m.isRead,
      attachments: m.attachments || [],
    };
  },

  /**
   * Fetch eligible database contacts for New Chat
   */
  async getEligibleContacts(): Promise<import('../types').ChatContactItem[]> {
    const res = await api.get<import('../types').ChatContactItem[]>('/chat/contacts');
    return res.data || [];
  },

  /**
   * Fetch total unread messages count
   */
  async getUnreadCount(): Promise<{ totalUnreadCount: number; unreadByConversation: Record<string, number> }> {
    const res = await api.get<{ totalUnreadCount: number; unreadByConversation: Record<string, number> }>('/chat/unread-count');
    return res.data || { totalUnreadCount: 0, unreadByConversation: {} };
  },

  /**
   * Mark a conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/chat/conversations/${conversationId}/read`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:unread-updated'));
    }
  },

  /**
   * Clear conversation history
   */
  async clearConversation(conversationId: string): Promise<void> {
    await api.post(`/chat/conversations/${conversationId}/clear`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:unread-updated'));
    }
  },
};

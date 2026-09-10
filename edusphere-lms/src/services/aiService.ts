import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { AiChatMessage, AiConversation } from '../types';

export interface SendAiMessagePayload {
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
  contextType?: 'general' | 'course' | 'lesson' | 'assignment' | 'quiz';
}

export interface SendAiMessageResponse {
  conversationId: string;
  message: AiChatMessage;
  tokensUsed: number;
}

export interface DailyUsageResponse {
  dailyLimit: number;
  requestsUsed: number;
  requestsRemaining: number;
  tokensConsumed: number;
}

export const aiService = {
  /**
   * Send a message to EduSphere Student AI Learning Assistant
   */
  async sendMessage(payload: SendAiMessagePayload): Promise<ApiResponse<SendAiMessageResponse>> {
    return await api.post<SendAiMessageResponse>('/student/ai/chat', payload);
  },

  /**
   * Get active student's AI conversations list
   */
  async getConversations(): Promise<ApiResponse<AiConversation[]>> {
    return await api.get<AiConversation[]>('/student/ai/conversations');
  },

  /**
   * Get all messages for a specific conversation
   */
  async getConversationMessages(
    conversationId: string
  ): Promise<ApiResponse<{ conversation: AiConversation; messages: AiChatMessage[] }>> {
    return await api.get<{ conversation: AiConversation; messages: AiChatMessage[] }>(
      `/student/ai/conversations/${conversationId}`
    );
  },

  /**
   * Get student's remaining daily AI requests quota
   */
  async getDailyUsage(): Promise<ApiResponse<DailyUsageResponse>> {
    return await api.get<DailyUsageResponse>('/student/ai/usage');
  },
};

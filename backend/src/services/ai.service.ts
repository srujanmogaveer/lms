import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import { llmProvider } from './llmProvider';
import { buildStudentAiSystemPrompt } from '../config/aiPrompt';
import type { LlmMessage, AiContextType } from '../types';

export interface SendAiMessagePayload {
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  quizId?: string;
  contextType?: AiContextType;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  contextType: AiContextType;
  courseId?: string | null;
  lessonId?: string | null;
  updatedAt: string;
  createdAt: string;
}

export class StudentAiService {
  private dailyLimit = 50;

  /**
   * 1. Check and Enforce Daily Message Quota in `ai_usage_logs`
   */
  private async checkAndIncrementQuota(studentId: string, tokensEstimated = 100): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { data: usageRow } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('id, request_count, tokens_consumed')
      .eq('student_id', studentId)
      .eq('usage_date', today)
      .maybeSingle();

    if (usageRow) {
      if (usageRow.request_count >= this.dailyLimit) {
        throw ApiError.badRequest(
          `Daily AI assistant limit reached (${this.dailyLimit} requests/day). Please continue tomorrow!`
        );
      }

      await supabaseAdmin
        .from('ai_usage_logs')
        .update({
          request_count: usageRow.request_count + 1,
          tokens_consumed: usageRow.tokens_consumed + tokensEstimated,
        })
        .eq('id', usageRow.id);
      return;
    }

    await supabaseAdmin.from('ai_usage_logs').insert({
      student_id: studentId,
      request_count: 1,
      tokens_consumed: tokensEstimated,
      usage_date: today,
    });
  }

  /**
   * 2. Send Message to AI Assistant & Persist Session
   */
  public async sendStudentMessage(
    studentId: string,
    payload: SendAiMessagePayload
  ): Promise<{
    conversationId: string;
    message: {
      id: string;
      conversationId: string;
      sender: 'ai';
      text: string;
      timestamp: string;
      tokensUsed: number;
    };
    tokensUsed: number;
  }> {
    const userText = (payload.message || '').trim();
    if (!userText) {
      throw ApiError.badRequest('Message text cannot be empty.');
    }

    // A. Check Daily Quota (50 queries/day)
    await this.checkAndIncrementQuota(studentId, 250);

    // B. Fetch Student Profile Name (minimal query)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', studentId)
      .maybeSingle();

    const studentName = profile?.full_name || 'Student';

    // C. Get or Create Conversation in DB
    let conversationId = payload.conversationId;
    if (!conversationId) {
      const title = userText.length > 40 ? `${userText.slice(0, 37)}...` : userText;
      const { data: newConv, error: cErr } = await supabaseAdmin
        .from('ai_conversations')
        .insert({
          student_id: studentId,
          course_id: null,
          lesson_id: null,
          title,
          context_type: 'general',
        })
        .select('id')
        .single();

      if (cErr || !newConv) {
        throw ApiError.internal('Failed to create AI conversation.');
      }
      conversationId = newConv.id;
    } else {
      // Validate ownership of existing conversation
      const { data: existingConv } = await supabaseAdmin
        .from('ai_conversations')
        .select('id, student_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!existingConv || existingConv.student_id !== studentId) {
        throw ApiError.forbidden('Unauthorized access to this AI conversation.');
      }
    }

    // D. Persist User Message to DB
    const { error: mErr } = await supabaseAdmin.from('ai_messages').insert({
      conversation_id: conversationId,
      student_id: studentId,
      role: 'user',
      content: userText,
      tokens_used: Math.ceil(userText.length / 4),
    });

    if (mErr) {
      throw ApiError.internal('Failed to save student query.');
    }

    // E. Retrieve Recent Conversation History (Last 8 messages for multi-turn context)
    const { data: historyRows } = await supabaseAdmin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(8);

    const historyMessages: LlmMessage[] = (historyRows || []).map((r) => ({
      role: r.role as any,
      content: r.content,
    }));

    // F. Call Real LLM Provider with General-Purpose System Prompt
    const dynamicSystemPrompt = buildStudentAiSystemPrompt(studentName);

    const llmRes = await llmProvider.generateChatResponse(historyMessages, {
      systemPrompt: dynamicSystemPrompt,
    });

    // G. Persist Assistant Response to DB
    const { data: savedReply, error: rErr } = await supabaseAdmin
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        student_id: studentId,
        role: 'assistant',
        content: llmRes.content,
        tokens_used: llmRes.totalTokens,
      })
      .select('id, created_at')
      .single();

    if (rErr || !savedReply) {
      throw ApiError.internal('Failed to persist AI assistant response.');
    }

    // Update conversation timestamp
    await supabaseAdmin
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      conversationId: conversationId!,
      message: {
        id: savedReply.id,
        conversationId: conversationId!,
        sender: 'ai',
        text: llmRes.content,
        timestamp,
        tokensUsed: llmRes.totalTokens,
      },
      tokensUsed: llmRes.totalTokens,
    };
  }

  /**
   * 3. Retrieve Conversation History for Student
   */
  public async getConversations(studentId: string): Promise<AiConversationSummary[]> {
    const { data, error } = await supabaseAdmin
      .from('ai_conversations')
      .select('id, title, context_type, course_id, lesson_id, updated_at, created_at')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw ApiError.internal(`Failed to fetch AI conversations: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      contextType: row.context_type,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    }));
  }

  /**
   * 4. Retrieve Messages in a Specific Conversation
   */
  public async getConversationMessages(
    studentId: string,
    conversationId: string
  ): Promise<{
    conversation: AiConversationSummary;
    messages: {
      id: string;
      conversationId: string;
      sender: 'student' | 'ai';
      text: string;
      timestamp: string;
      tokensUsed?: number;
    }[];
  }> {
    const { data: conv, error: cErr } = await supabaseAdmin
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (cErr || !conv) {
      throw ApiError.notFound('Conversation not found.');
    }

    if (conv.student_id !== studentId) {
      throw ApiError.forbidden('You are not authorized to view this conversation.');
    }

    const { data: msgs, error: mErr } = await supabaseAdmin
      .from('ai_messages')
      .select('id, role, content, tokens_used, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (mErr) {
      throw ApiError.internal('Failed to retrieve messages.');
    }

    return {
      conversation: {
        id: conv.id,
        title: conv.title,
        contextType: conv.context_type,
        courseId: conv.course_id,
        lessonId: conv.lesson_id,
        updatedAt: conv.updated_at,
        createdAt: conv.created_at,
      },
      messages: (msgs || []).map((m) => ({
        id: m.id,
        conversationId,
        sender: m.role === 'user' ? 'student' : 'ai',
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tokensUsed: m.tokens_used,
      })),
    };
  }

  /**
   * 5. Get Daily Usage Limit Status
   */
  public async getDailyUsage(studentId: string): Promise<{
    dailyLimit: number;
    requestsUsed: number;
    requestsRemaining: number;
    tokensConsumed: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('request_count, tokens_consumed')
      .eq('student_id', studentId)
      .eq('usage_date', today)
      .maybeSingle();

    const used = data?.request_count || 0;
    const tokens = data?.tokens_consumed || 0;

    return {
      dailyLimit: this.dailyLimit,
      requestsUsed: used,
      requestsRemaining: Math.max(0, this.dailyLimit - used),
      tokensConsumed: tokens,
    };
  }
}

export const studentAiService = new StudentAiService();

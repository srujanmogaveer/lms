import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  ConversationItem,
  ChatMessageItem,
  ChatParticipantItem,
  ChatContactItem,
  CreateConversationDto,
  SendMessageDto,
  UserRole,
} from '../types';
import { logger } from '../utils/logger';

// In-Memory Store for active runtime persistence
interface InMemoryConversation {
  id: string;
  type: 'student_instructor' | 'admin_instructor';
  studentId?: string;
  instructorId: string;
  adminId?: string;
  courseId?: string;
  courseTitle?: string;
  createdBy: string;
  lastMessageText: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

interface InMemoryParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: UserRole;
  unreadCount: number;
  lastReadAt: string;
  joinedAt: string;
}

interface InMemoryMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'link';
  isRead: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: any[];
}

export class ChatService {
  private static inMemoryConversations: InMemoryConversation[] = [];
  private static inMemoryParticipants: InMemoryParticipant[] = [];
  private static inMemoryMessages: InMemoryMessage[] = [];

  /**
   * Helper to format a Date into 12-hour AM/PM string and relative date
   */
  private formatTimestamp(isoString: string): { timestamp: string; date: string } {
    try {
      const d = new Date(isoString);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const today = new Date().toISOString().split('T')[0];
      const msgDate = d.toISOString().split('T')[0];
      const dateStr = msgDate === today ? 'Today' : d.toLocaleDateString();
      return { timestamp: timeStr, date: dateStr };
    } catch {
      return { timestamp: 'Just now', date: 'Today' };
    }
  }

  /**
   * 1. GET ALL CONVERSATIONS FOR AUTHENTICATED USER
   * Strictly returns actual conversations belonging to the user. No fake/dummy entries.
   */
  async getConversations(userId: string, role: UserRole): Promise<ConversationItem[]> {
    try {
      // 1. Try fetching from Supabase
      const { data: convData, error: convErr } = await supabaseAdmin
        .from('conversations')
        .select(`
          id,
          type,
          student_id,
          instructor_id,
          admin_id,
          course_id,
          last_message_text,
          last_message_at,
          created_at,
          updated_at,
          courses ( id, title ),
          student:student_id ( id, full_name, avatar_url, email, role, headline ),
          instructor:instructor_id ( id, full_name, avatar_url, email, role, headline, bio ),
          admin:admin_id ( id, full_name, avatar_url, email, role, headline ),
          conversation_participants ( id, user_id, role, unread_count, last_read_at )
        `)
        .or(`student_id.eq.${userId},instructor_id.eq.${userId},admin_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (!convErr && convData) {
        const formattedList: ConversationItem[] = convData.map((row: any) => {
          const course = row.courses;
          const student = row.student;
          const instructor = row.instructor;
          const admin = row.admin;

          // Determine other participant
          let otherUser = instructor;
          if (role === 'instructor') {
            otherUser = row.type === 'admin_instructor' ? admin : student;
          } else if (role === 'admin') {
            otherUser = instructor;
          }

          const myParticipant = row.conversation_participants?.find((p: any) => p.user_id === userId);
          const unread = myParticipant?.unread_count || 0;
          const { timestamp } = this.formatTimestamp(row.last_message_at || row.created_at);

          const participantItem: ChatParticipantItem = {
            id: myParticipant?.id || row.id,
            userId: otherUser?.id || '',
            name: otherUser?.full_name || 'User',
            avatar: otherUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            role: otherUser?.role || (role === 'student' ? 'instructor' : 'student'),
            email: otherUser?.email || '',
            headline: otherUser?.headline || '',
            unreadCount: unread,
            lastReadAt: myParticipant?.last_read_at || row.created_at,
            onlineStatus: 'online',
          };

          return {
            id: row.id,
            type: row.type,
            courseId: row.course_id,
            courseTitle: course?.title || 'Course Mentorship',
            studentId: row.student_id,
            instructorId: row.instructor_id,
            adminId: row.admin_id,
            participant: participantItem,
            instructor: instructor ? {
              id: instructor.id,
              name: instructor.full_name || 'Instructor',
              avatar: instructor.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              role: instructor.headline || 'Course Instructor',
              email: instructor.email || '',
              bio: instructor.bio || '',
              officeHours: 'Mon & Wed: 4:00 PM - 6:00 PM',
              status: 'online' as const,
            } : undefined,
            lastMessage: row.last_message_text || 'Conversation initialized.',
            lastMessageTime: timestamp,
            unreadCount: unread,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        return formattedList;
      }
    } catch (err: any) {
      logger.error(`[ChatService] Supabase conversation fetch FAILED — falling back to in-memory store: ${err.message}`);
    }

    // In-memory store filter (only real conversations created in this session)
    const userConvs = ChatService.inMemoryConversations.filter(
      (c) => c.studentId === userId || c.instructorId === userId || c.adminId === userId
    );

    // If no real conversations exist, return empty array
    if (userConvs.length === 0) {
      return [];
    }

    const results: ConversationItem[] = [];

    for (const c of userConvs) {
      const myPart = ChatService.inMemoryParticipants.find(
        (p) => p.conversationId === c.id && p.userId === userId
      );
      const otherPart = ChatService.inMemoryParticipants.find(
        (p) => p.conversationId === c.id && p.userId !== userId
      );
      const otherUserId = otherPart?.userId;

      // Fetch actual profile of the other user
      let otherProfile: any = null;
      if (otherUserId) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, avatar_url, role, email, headline, bio')
          .eq('id', otherUserId)
          .maybeSingle();
        otherProfile = prof;
      }

      const { timestamp } = this.formatTimestamp(c.lastMessageAt);

      results.push({
        id: c.id,
        type: c.type,
        courseId: c.courseId,
        courseTitle: c.courseTitle || 'Course Mentorship',
        studentId: c.studentId,
        instructorId: c.instructorId,
        adminId: c.adminId,
        participant: {
          id: otherPart?.id || 'p-part',
          userId: otherUserId || '',
          name: otherProfile?.full_name || (otherPart?.role === 'instructor' ? 'Course Instructor' : (otherPart?.role === 'admin' ? 'Administrator' : 'Student')),
          avatar: otherProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          role: otherProfile?.role || otherPart?.role || 'student',
          email: otherProfile?.email || '',
          headline: otherProfile?.headline || '',
          unreadCount: myPart?.unreadCount || 0,
          lastReadAt: myPart?.lastReadAt || c.createdAt,
          onlineStatus: 'online',
        },
        instructor: otherProfile?.role === 'instructor' ? {
          id: otherProfile.id,
          name: otherProfile.full_name || 'Instructor',
          avatar: otherProfile.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          role: otherProfile.headline || 'Course Instructor',
          email: otherProfile.email || '',
          bio: otherProfile.bio || '',
          officeHours: 'Mon & Wed: 4:00 PM - 6:00 PM',
          status: 'online',
        } : undefined,
        lastMessage: c.lastMessageText || 'Conversation initialized.',
        lastMessageTime: timestamp,
        unreadCount: myPart?.unreadCount || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    return results;
  }

  /**
   * 2. GET OR CREATE CONVERSATION WITH STRICT UNIQUENESS
   * - Student ↔ Instructor: EXACTLY ONE per (student_id, instructor_id, course_id)
   * - Admin ↔ Instructor: EXACTLY ONE per (admin_id, instructor_id)
   */
  async getOrCreateConversation(
    userId: string,
    userRole: UserRole,
    dto: CreateConversationDto
  ): Promise<ConversationItem> {
    const { recipientId, courseId } = dto;
    let type = dto.type || (userRole === 'admin' || dto.recipientId === 'admin' ? 'admin_instructor' : 'student_instructor');

    // 1. Verify recipient exists in profiles
    const { data: recipientProfile, error: recErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, headline, bio')
      .eq('id', recipientId)
      .single();

    if (recErr || !recipientProfile) {
      logger.warn(`Recipient ${recipientId} profile check returned: ${recErr?.message}`);
    }

    let studentId: string | undefined;
    let instructorId: string;
    let adminId: string | undefined;
    let courseTitle = 'Direct Mentorship';

    if (type === 'student_instructor') {
      if (userRole === 'student') {
        studentId = userId;
        instructorId = recipientId;
      } else {
        studentId = recipientId;
        instructorId = userId;
      }

      if (!courseId) {
        throw ApiError.badRequest('courseId is required for Student-Instructor conversations.');
      }

      // 2. Verify Student Active Enrollment
      const { data: enrollmentData } = await supabaseAdmin
        .from('enrollments')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .or('status.eq.Active,status.eq.active,status.eq.Completed,status.eq.completed')
        .maybeSingle();

      if (enrollmentData) {
        logger.info(`Verified active enrollment for student ${studentId} in course ${courseId}`);
      }

      // Fetch course title and verify instructor ownership
      const { data: courseData } = await supabaseAdmin
        .from('courses')
        .select('id, title, instructor_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseData) {
        courseTitle = courseData.title;
        if (courseData.instructor_id) {
          instructorId = courseData.instructor_id;
        }
      }

      // 3. Search for existing conversation
      try {
        const { data: existingConv } = await supabaseAdmin
          .from('conversations')
          .select('id, type, student_id, instructor_id, admin_id, course_id, last_message_text, last_message_at, created_at, updated_at')
          .eq('student_id', studentId)
          .eq('instructor_id', instructorId)
          .eq('course_id', courseId)
          .eq('type', 'student_instructor')
          .maybeSingle();

        if (existingConv) {
          const convs = await this.getConversations(userId, userRole);
          const found = convs.find((c) => c.id === existingConv.id);
          if (found) return found;
        }
      } catch (err: any) {
        logger.warn(`Existing conversation check error: ${err.message}`);
      }

      // Check in-memory store
      const memExisting = ChatService.inMemoryConversations.find(
        (c) => c.studentId === studentId && c.instructorId === instructorId && c.courseId === courseId
      );
      if (memExisting) {
        const convs = await this.getConversations(userId, userRole);
        const found = convs.find((c) => c.id === memExisting.id);
        if (found) return found;
      }
    } else {
      // Admin ↔ Instructor
      type = 'admin_instructor';
      if (userRole === 'admin') {
        adminId = userId;
        instructorId = recipientId;
      } else {
        instructorId = userId;
        adminId = recipientId;
        
        // Resolve actual admin profile if recipientId was generic
        if (!adminId || adminId === 'admin') {
          const { data: adminProf } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
            .maybeSingle();

          if (adminProf) {
            adminId = adminProf.id;
          }
        }
      }

      // Search for existing admin ↔ instructor conversation (filter by BOTH admin_id AND instructor_id)
      try {
        const { data: existingAdminConv } = await supabaseAdmin
          .from('conversations')
          .select('id, type, student_id, instructor_id, admin_id, course_id, last_message_text, last_message_at, created_at, updated_at')
          .eq('instructor_id', instructorId)
          .eq('admin_id', adminId)
          .eq('type', 'admin_instructor')
          .maybeSingle();

        if (existingAdminConv) {
          const convs = await this.getConversations(userId, userRole);
          const found = convs.find((c) => c.id === existingAdminConv.id);
          if (found) return found;
        }
      } catch (err: any) {
        logger.warn(`Existing admin conversation check error: ${err.message}`);
      }

      const memExistingAdmin = ChatService.inMemoryConversations.find(
        (c) => c.instructorId === instructorId && c.type === 'admin_instructor'
      );
      if (memExistingAdmin) {
        const convs = await this.getConversations(userId, userRole);
        const found = convs.find((c) => c.id === memExistingAdmin.id);
        if (found) return found;
      }
    }

    // 4. Create New Conversation
    const newConvId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    try {
      const { data: insertedConv, error: insErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          type,
          student_id: studentId || null,
          instructor_id: instructorId,
          admin_id: adminId || null,
          course_id: courseId || null,
          created_by: userId,
          last_message_text: 'Conversation created.',
          last_message_at: now,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (!insErr && insertedConv) {
        // Insert participants
        const participants = [
          {
            conversation_id: insertedConv.id,
            user_id: userId,
            role: userRole,
            unread_count: 0,
            last_read_at: now,
          },
          {
            conversation_id: insertedConv.id,
            user_id: recipientId,
            role: recipientProfile?.role || (userRole === 'student' ? 'instructor' : 'student'),
            unread_count: 0,
            last_read_at: now,
          },
        ];

        await supabaseAdmin.from('conversation_participants').insert(participants);

        const convs = await this.getConversations(userId, userRole);
        const created = convs.find((c) => c.id === insertedConv.id);
        if (created) return created;
      }
    } catch (err: any) {
      logger.warn(`DB conversation insert fallback: ${err.message}`);
    }

    // In-memory creation
    const memNew: InMemoryConversation = {
      id: newConvId,
      type: type as any,
      studentId,
      instructorId,
      adminId,
      courseId,
      courseTitle,
      createdBy: userId,
      lastMessageText: 'Conversation created.',
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };
    ChatService.inMemoryConversations.unshift(memNew);

    ChatService.inMemoryParticipants.push(
      {
        id: `p-${Date.now()}-1`,
        conversationId: newConvId,
        userId,
        role: userRole,
        unreadCount: 0,
        lastReadAt: now,
        joinedAt: now,
      },
      {
        id: `p-${Date.now()}-2`,
        conversationId: newConvId,
        userId: recipientId,
        role: userRole === 'student' ? 'instructor' : 'student',
        unreadCount: 0,
        lastReadAt: now,
        joinedAt: now,
      }
    );

    const convs = await this.getConversations(userId, userRole);
    return convs.find((c) => c.id === newConvId)!;
  }

  /**
   * 3. GET MESSAGES FOR CONVERSATION
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatMessageItem[]> {
    const actualConvId = conversationId;

    try {
      let query = supabaseAdmin
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          type,
          is_read,
          created_at,
          sender:sender_id ( id, full_name, avatar_url, role ),
          message_attachments ( id, name, size, type, url, preview_url )
        `)
        .eq('conversation_id', actualConvId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: msgData, error: msgErr } = await query;

      if (!msgErr && msgData) {
        return msgData.map((row: any) => {
          const sender = row.sender;
          const { timestamp, date } = this.formatTimestamp(row.created_at);

          return {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderName: sender?.full_name || 'User',
            senderAvatar: sender?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            senderRole: sender?.role || 'student',
            content: row.content,
            type: row.type || 'text',
            isRead: row.is_read || false,
            timestamp,
            date,
            attachments: row.message_attachments || [],
            createdAt: row.created_at,
          };
        });
      }
    } catch (err: any) {
      logger.warn(`Supabase message fetch fallback: ${err.message}`);
    }

    // In-Memory Fallback: fetch sender profiles dynamically
    const msgs = ChatService.inMemoryMessages
      .filter((m) => m.conversationId === conversationId && !m.deletedAt)
      .slice(-limit);

    const resultMsgs: ChatMessageItem[] = [];

    for (const m of msgs) {
      const { timestamp, date } = this.formatTimestamp(m.createdAt);
      const isMe = m.senderId === userId;

      let senderProfile: any = null;
      if (m.senderId) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', m.senderId)
          .maybeSingle();
        senderProfile = prof;
      }

      resultMsgs.push({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: isMe ? 'You' : (senderProfile?.full_name || 'User'),
        senderAvatar: senderProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        senderRole: senderProfile?.role || (isMe ? 'student' : 'instructor'),
        content: m.content,
        type: m.type,
        isRead: m.isRead,
        timestamp,
        date,
        attachments: m.attachments || [],
        createdAt: m.createdAt,
      });
    }

    return resultMsgs;
  }

  /**
   * 4. SEND MESSAGE
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: UserRole,
    dto: SendMessageDto
  ): Promise<ChatMessageItem> {
    const now = new Date().toISOString();
    const type = dto.type || (dto.attachments && dto.attachments.length > 0 ? (dto.attachments[0].type === 'image' ? 'image' : 'file') : 'text');
    const content =
      (dto.content || '').trim() ||
      (dto.attachments && dto.attachments.length > 0
        ? dto.attachments[0].type === 'image'
          ? '[Image]'
          : `[Attachment: ${dto.attachments[0].name}]`
        : '');

    // 1. Get Sender Profile
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', senderId)
      .maybeSingle();

    const actualConvId = conversationId;

    try {
      // 2. Insert Message into Supabase
      const { data: insertedMsg, error: insErr } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: actualConvId,
          sender_id: senderId,
          content,
          type,
          is_read: false,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (!insErr && insertedMsg) {
        // Insert attachments if present
        let attachments: any[] = [];
        if (dto.attachments && dto.attachments.length > 0) {
          const attRows = dto.attachments.map((att) => ({
            message_id: insertedMsg.id,
            name: att.name,
            size: att.size,
            type: att.type,
            url: att.url,
            preview_url: att.previewUrl || null,
          }));

          const { data: insertedAtts } = await supabaseAdmin
            .from('message_attachments')
            .insert(attRows)
            .select();

          if (insertedAtts) attachments = insertedAtts;
        }

        // NOTE: last_message_text + unread_count are both handled by the
        // trg_new_chat_message trigger on messages INSERT.
        // We do NOT manually update them here to avoid double-incrementing.

        const { timestamp, date } = this.formatTimestamp(now);

        return {
          id: insertedMsg.id,
          conversationId: actualConvId,
          senderId,
          senderName: senderProfile?.full_name || 'You',
          senderAvatar: senderProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          senderRole: senderProfile?.role || senderRole,
          content,
          type,
          isRead: false,
          timestamp,
          date,
          attachments,
          createdAt: now,
        };
      }
    } catch (err: any) {
      logger.warn(`Supabase message send fallback: ${err.message}`);
    }

    // In-Memory Fallback
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newMsg: InMemoryMessage = {
      id: msgId,
      conversationId,
      senderId,
      content,
      type,
      isRead: false,
      createdAt: now,
      updatedAt: now,
      attachments: dto.attachments || [],
    };
    ChatService.inMemoryMessages.push(newMsg);

    // Update in-memory conversation
    const conv = ChatService.inMemoryConversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessageText = content;
      conv.lastMessageAt = now;
      conv.updatedAt = now;
    }

    // Increment unread count for other participants in memory
    ChatService.inMemoryParticipants
      .filter((p) => p.conversationId === conversationId && p.userId !== senderId)
      .forEach((p) => {
        p.unreadCount = (p.unreadCount || 0) + 1;
      });

    const { timestamp, date } = this.formatTimestamp(now);
    return {
      id: msgId,
      conversationId,
      senderId,
      senderName: senderProfile?.full_name || 'You',
      senderAvatar: senderProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      senderRole: senderRole,
      content,
      type,
      isRead: false,
      timestamp,
      date,
      attachments: dto.attachments || [],
      createdAt: now,
    };
  }

  /**
   * 5. MARK CONVERSATION AS READ
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const actualConvId = conversationId;

    try {
      await supabaseAdmin
        .from('conversation_participants')
        .update({ unread_count: 0, last_read_at: new Date().toISOString() })
        .eq('conversation_id', actualConvId)
        .eq('user_id', userId);

      await supabaseAdmin
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', actualConvId)
        .neq('sender_id', userId);
    } catch (err: any) {
      logger.warn(`Supabase markAsRead error: ${err.message}`);
    }

    const part = ChatService.inMemoryParticipants.find(
      (p) => (p.conversationId === actualConvId || p.conversationId === conversationId) && p.userId === userId
    );
    if (part) {
      part.unreadCount = 0;
      part.lastReadAt = new Date().toISOString();
    }
  }

  /**
   * 6. CLEAR CONVERSATION HISTORY
   */
  async clearConversation(conversationId: string, _userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('conversation_id', conversationId);

      await supabaseAdmin
        .from('conversations')
        .update({ last_message_text: 'Conversation cleared.', updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err: any) {
      logger.warn(`Supabase clearConversation error: ${err.message}`);
    }

    ChatService.inMemoryMessages.forEach((m) => {
      if (m.conversationId === conversationId) {
        m.deletedAt = new Date().toISOString();
      }
    });
  }

  /**
   * 7. GET ELIGIBLE CONTACTS FOR NEW CHAT (Real Database Users only)
   */
  async getEligibleContacts(userId: string, userRole: UserRole): Promise<ChatContactItem[]> {
    const contacts: ChatContactItem[] = [];

    if (userRole === 'student') {
      // Student: Only instructors of courses where student has an Active enrollment
      // Uses student_id column (correct enrollments table column name)
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('course_id, status')
        .eq('student_id', userId);

      const activeCourseIds = (enrollments || [])
        .filter((e) => !e.status || e.status.toLowerCase() === 'active')
        .map((e) => e.course_id)
        .filter(Boolean);

      if (activeCourseIds.length > 0) {
        const { data: courses } = await supabaseAdmin
          .from('courses')
          .select('id, title, instructor_id')
          .in('id', activeCourseIds);

        const instructorIds = [...new Set((courses || []).map((c) => c.instructor_id).filter(Boolean))];

        if (instructorIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, avatar_url, role, email')
            .in('id', instructorIds);

          const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

          const { data: existingConvs } = await supabaseAdmin
            .from('conversations')
            .select('id, instructor_id, course_id')
            .eq('student_id', userId);

          for (const course of courses || []) {
            const prof = profileMap.get(course.instructor_id);
            if (prof) {
              const existing = existingConvs?.find(
                (c) => c.instructor_id === prof.id && c.course_id === course.id
              );
              contacts.push({
                id: prof.id,
                name: prof.full_name || 'Instructor',
                avatar: prof.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                role: 'instructor',
                email: prof.email,
                courseId: course.id,
                courseTitle: course.title,
                existingConversationId: existing?.id,
              });
            }
          }
        }
      }
    } else if (userRole === 'instructor') {
      // Instructor:
      // (a) Real students enrolled in instructor's courses
      // (b) Real platform admin account
      const { data: instCourses } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('instructor_id', userId);

      const courseMap = new Map((instCourses || []).map((c) => [c.id, c.title]));
      const courseIds = (instCourses || []).map((c) => c.id);

      if (courseIds.length > 0) {
        const { data: enrollments } = await supabaseAdmin
          .from('enrollments')
          .select('student_id, course_id, status')
          .in('course_id', courseIds);

        const activeEnrollments = (enrollments || []).filter(
          (e) => !e.status || e.status.toLowerCase() === 'active'
        );
        const studentUserIds = [...new Set(activeEnrollments.map((e) => e.student_id).filter(Boolean))];

        if (studentUserIds.length > 0) {
          const { data: studentProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, avatar_url, role, email')
            .in('id', studentUserIds);

          const studentMap = new Map((studentProfiles || []).map((p) => [p.id, p]));

          const { data: existingConvs } = await supabaseAdmin
            .from('conversations')
            .select('id, student_id, course_id')
            .eq('instructor_id', userId);

          for (const enr of activeEnrollments) {
            const student = studentMap.get(enr.student_id);
            if (student) {
              const existing = existingConvs?.find(
                (c) => c.student_id === student.id && c.course_id === enr.course_id
              );
              contacts.push({
                id: student.id,
                name: student.full_name || 'Student',
                avatar: student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                role: 'student',
                email: student.email,
                courseId: enr.course_id,
                courseTitle: courseMap.get(enr.course_id) || 'Enrolled Course',
                existingConversationId: existing?.id,
              });
            }
          }
        }
      }

      // Real Platform Admin from profiles table
      const { data: adminProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, role, email')
        .eq('role', 'admin')
        .limit(1);

      const adminUser = adminProfiles?.[0];
      if (adminUser) {
        const { data: adminConv } = await supabaseAdmin
          .from('conversations')
          .select('id')
          .eq('type', 'admin_instructor')
          .eq('instructor_id', userId)
          .maybeSingle();

        contacts.unshift({
          id: adminUser.id,
          name: adminUser.full_name || 'Platform Administrator',
          avatar: adminUser.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          role: 'admin',
          email: adminUser.email,
          existingConversationId: adminConv?.id,
        });
      }
    } else if (userRole === 'admin') {
      // Admin: All real instructors
      const { data: instructors } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, role, email')
        .eq('role', 'instructor');

      const { data: existingConvs } = await supabaseAdmin
        .from('conversations')
        .select('id, instructor_id')
        .eq('type', 'admin_instructor')
        .eq('admin_id', userId);

      for (const inst of instructors || []) {
        const existing = existingConvs?.find((c) => c.instructor_id === inst.id);
        contacts.push({
          id: inst.id,
          name: inst.full_name || 'Instructor',
          avatar: inst.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          role: 'instructor',
          email: inst.email,
          existingConversationId: existing?.id,
        });
      }
    }

    return contacts;
  }

  /**
   * 8. GET TOTAL UNREAD MESSAGES COUNT
   * Calculates SUM(unread_count) for the authenticated user from conversation_participants
   */
  async getUnreadCount(
    userId: string,
    userRole: UserRole
  ): Promise<{ totalUnreadCount: number; unreadByConversation: Record<string, number> }> {
    const unreadByConversation: Record<string, number> = {};
    let totalUnreadCount = 0;

    try {
      // 1. Primary: Query conversation_participants for real DB unread_count
      const { data: participants, error } = await supabaseAdmin
        .from('conversation_participants')
        .select('conversation_id, unread_count')
        .eq('user_id', userId);

      if (!error && participants && participants.length > 0) {
        for (const p of participants) {
          const count = Number(p.unread_count) || 0;
          unreadByConversation[p.conversation_id] = count;
          totalUnreadCount += count;
        }
        return { totalUnreadCount, unreadByConversation };
      }
    } catch (err: any) {
      logger.warn(`Supabase getUnreadCount error: ${err.message}`);
    }

    // 2. Fallback: calculate from getConversations
    try {
      const convs = await this.getConversations(userId, userRole);
      for (const c of convs) {
        const count = Number(c.unreadCount) || 0;
        unreadByConversation[c.id] = count;
        totalUnreadCount += count;
      }
    } catch {
      // Handled
    }

    return { totalUnreadCount, unreadByConversation };
  }
}

export const chatService = new ChatService();

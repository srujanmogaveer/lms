import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  DiscussionItem,
  DiscussionReplyItem,
  ForumAttachmentItem,
  DiscussionModerationReportItem,
  CreateDiscussionDto,
  UpdateDiscussionDto,
  CreateReplyDto,
  UpdateReplyDto,
  ModerateDiscussionDto,
  ModerateReplyDto,
  CreateModerationReportDto,
  ResolveModerationReportDto,
  UserRole,
} from '../types';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

export class ForumService {
  // In-memory fallback store for resilience
  private static inMemoryDiscussions: DiscussionItem[] = [];
  private static inMemoryReplies: DiscussionReplyItem[] = [];
  private static inMemoryReactions: { id: string; userId: string; targetType: 'discussion' | 'reply'; targetId: string; createdAt: string }[] = [];
  private static inMemoryReports: DiscussionModerationReportItem[] = [];

  /**
   * Helper: Get list of accessible course IDs for a user
   */
  public static async getAccessibleCourseIds(userId: string, userRole: UserRole): Promise<string[] | null> {
    if (userRole === 'admin') return null; // null means all courses

    try {
      if (userRole === 'instructor') {
        const { data: courses } = await supabaseAdmin
          .from('courses')
          .select('id')
          .eq('instructor_id', userId);
        return (courses || []).map((c) => c.id);
      } else {
        const { data: enrollments } = await supabaseAdmin
          .from('enrollments')
          .select('course_id')
          .eq('student_id', userId)
          .in('status', ['Active', 'Completed']);
        return (enrollments || []).map((e) => e.course_id);
      }
    } catch {
      return null;
    }
  }

  /**
   * Format DB Discussion row into DiscussionItem
   */
  private static formatDiscussion(row: any, _currentUserId?: string, userLikedIds?: Set<string>): DiscussionItem {
    const author = row.profiles;
    const course = row.courses;
    const isLiked = userLikedIds ? userLikedIds.has(row.id) : Boolean(row.is_liked);

    const attachments: ForumAttachmentItem[] = Array.isArray(row.discussion_attachments)
      ? row.discussion_attachments.map((a: any) => ({
          id: a.id,
          discussionId: a.discussion_id,
          fileName: a.file_name,
          fileUrl: a.file_url,
          fileSize: a.file_size,
          fileType: a.file_type,
          uploadedBy: a.uploaded_by,
          createdAt: a.created_at,
        }))
      : [];

    return {
      id: row.id,
      courseId: row.course_id,
      courseTitle: course?.title || row.course_title || 'Course Discussion',
      authorId: row.author_id,
      authorName: author?.full_name || row.author_name || 'User',
      authorAvatar: author?.avatar_url || row.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: (author?.role as any) || row.author_role || 'student',
      category: row.category || 'General Discussion',
      title: row.title,
      content: row.content,
      isPinned: Boolean(row.is_pinned),
      isSolved: Boolean(row.is_solved),
      isLocked: Boolean(row.is_locked),
      viewsCount: Number(row.views_count) || 0,
      likesCount: Number(row.likes_count) || 0,
      repliesCount: Number(row.replies_count) || 0,
      isLiked,
      attachments,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Format DB Reply row into DiscussionReplyItem
   */
  private static formatReply(row: any, userLikedIds?: Set<string>): DiscussionReplyItem {
    const author = row.profiles;
    const isLiked = userLikedIds ? userLikedIds.has(row.id) : Boolean(row.is_liked);

    const attachments: ForumAttachmentItem[] = Array.isArray(row.discussion_attachments)
      ? row.discussion_attachments.map((a: any) => ({
          id: a.id,
          replyId: a.reply_id,
          fileName: a.file_name,
          fileUrl: a.file_url,
          fileSize: a.file_size,
          fileType: a.file_type,
          uploadedBy: a.uploaded_by,
          createdAt: a.created_at,
        }))
      : [];

    return {
      id: row.id,
      discussionId: row.discussion_id,
      authorId: row.author_id,
      authorName: author?.full_name || row.author_name || 'User',
      authorAvatar: author?.avatar_url || row.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: (author?.role as any) || row.author_role || 'student',
      content: row.content,
      isAcceptedAnswer: Boolean(row.is_accepted_answer),
      isPinned: Boolean(row.is_pinned),
      likesCount: Number(row.likes_count) || 0,
      isLiked,
      attachments,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  /**
   * 1. Get Discussions with Filtering & Pagination (Optimized query with narrow select)
   */
  public static async getDiscussions(
    userId: string,
    userRole: UserRole,
    query: {
      courseId?: string;
      category?: string;
      status?: string; // 'all' | 'unanswered' | 'answered' | 'solved' | 'pinned' | 'my'
      search?: string;
      sortBy?: string; // 'latest' | 'popular' | 'oldest'
      page?: number;
      limit?: number;
    }
  ): Promise<{
    discussions: DiscussionItem[];
    total: number;
    page: number;
    limit: number;
    stats: {
      total: number;
      unanswered: number;
      answered: number;
      solved: number;
      pinned: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    try {
      const accessibleCourseIds = await this.getAccessibleCourseIds(userId, userRole);

      // If user is not admin and has 0 accessible courses
      if (accessibleCourseIds !== null && accessibleCourseIds.length === 0) {
        return {
          discussions: [],
          total: 0,
          page,
          limit,
          stats: { total: 0, unanswered: 0, answered: 0, solved: 0, pinned: 0 },
        };
      }

      let dbQuery = supabaseAdmin
        .from('course_discussions')
        .select(
          `id, course_id, author_id, category, title, content, is_pinned, is_solved, is_locked, views_count, likes_count, replies_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role),
           courses:course_id(id, title),
           discussion_attachments(id, file_name, file_url, file_size, file_type)`,
          { count: 'exact' }
        );

      if (query.courseId && query.courseId !== 'all') {
        dbQuery = dbQuery.eq('course_id', query.courseId);
      } else if (accessibleCourseIds !== null) {
        dbQuery = dbQuery.in('course_id', accessibleCourseIds);
      }

      if (query.category && query.category !== 'All Categories') {
        dbQuery = dbQuery.eq('category', query.category);
      }

      if (query.status === 'unanswered') {
        dbQuery = dbQuery.eq('replies_count', 0);
      } else if (query.status === 'answered') {
        dbQuery = dbQuery.gt('replies_count', 0);
      } else if (query.status === 'solved') {
        dbQuery = dbQuery.eq('is_solved', true);
      } else if (query.status === 'pinned') {
        dbQuery = dbQuery.eq('is_pinned', true);
      } else if (query.status === 'my') {
        dbQuery = dbQuery.eq('author_id', userId);
      }

      if (query.search?.trim()) {
        const s = `%${query.search.trim()}%`;
        dbQuery = dbQuery.or(`title.ilike.${s},content.ilike.${s}`);
      }

      // Order: Pinned first, then chosen sort
      if (query.sortBy === 'popular') {
        dbQuery = dbQuery.order('is_pinned', { ascending: false }).order('views_count', { ascending: false });
      } else if (query.sortBy === 'oldest') {
        dbQuery = dbQuery.order('is_pinned', { ascending: false }).order('created_at', { ascending: true });
      } else {
        dbQuery = dbQuery.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      dbQuery = dbQuery.range(offset, offset + limit - 1);

      const { data, count, error } = await dbQuery;

      if (!error && Array.isArray(data)) {
        // Fetch current user's liked discussions in a single batch to avoid N+1 queries
        const discIds = data.map((d: any) => d.id);
        const userLikedSet = new Set<string>();

        if (discIds.length > 0) {
          const { data: userReactions } = await supabaseAdmin
            .from('discussion_reactions')
            .select('target_id')
            .eq('user_id', userId)
            .eq('target_type', 'discussion')
            .in('target_id', discIds);

          if (Array.isArray(userReactions)) {
            userReactions.forEach((r: any) => userLikedSet.add(r.target_id));
          }
        }

        const discussions = data.map((d: any) => this.formatDiscussion(d, userId, userLikedSet));
        const total = count || discussions.length;

        // Compute metrics
        const unanswered = discussions.filter((d) => d.repliesCount === 0).length;
        const answered = discussions.filter((d) => d.repliesCount > 0).length;
        const solved = discussions.filter((d) => d.isSolved).length;
        const pinned = discussions.filter((d) => d.isPinned).length;

        return {
          discussions,
          total,
          page,
          limit,
          stats: { total, unanswered, answered, solved, pinned },
        };
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch discussions from Supabase: ${err.message}`);
    }

    // Fallback store processing
    let result = [...this.inMemoryDiscussions];

    if (query.courseId && query.courseId !== 'all') {
      result = result.filter((d) => d.courseId === query.courseId);
    }
    if (query.category && query.category !== 'All Categories') {
      result = result.filter((d) => d.category === query.category);
    }
    if (query.status === 'unanswered') {
      result = result.filter((d) => d.repliesCount === 0);
    } else if (query.status === 'answered') {
      result = result.filter((d) => d.repliesCount > 0);
    } else if (query.status === 'solved') {
      result = result.filter((d) => d.isSolved);
    } else if (query.status === 'pinned') {
      result = result.filter((d) => d.isPinned);
    } else if (query.status === 'my') {
      result = result.filter((d) => d.authorId === userId);
    }

    if (query.search?.trim()) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.authorName.toLowerCase().includes(q) ||
          d.courseTitle.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (query.sortBy === 'popular') return b.viewsCount - a.viewsCount;
      if (query.sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    const unanswered = result.filter((d) => d.repliesCount === 0).length;
    const answered = result.filter((d) => d.repliesCount > 0).length;
    const solved = result.filter((d) => d.isSolved).length;
    const pinned = result.filter((d) => d.isPinned).length;

    return {
      discussions: paginated,
      total,
      page,
      limit,
      stats: { total, unanswered, answered, solved, pinned },
    };
  }

  /**
   * 2. Get Discussion Details with Replies & Atomic View Increment
   */
  public static async getDiscussionDetails(
    discussionId: string,
    userId: string,
    _userRole: UserRole
  ): Promise<DiscussionItem> {
    try {
      // 1. Fetch Discussion
      const { data: discussion, error: discErr } = await supabaseAdmin
        .from('course_discussions')
        .select(
          `id, course_id, author_id, category, title, content, is_pinned, is_solved, is_locked, views_count, likes_count, replies_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role),
           courses:course_id(id, title, instructor_id),
           discussion_attachments(id, file_name, file_url, file_size, file_type)`
        )
        .eq('id', discussionId)
        .single();

      if (!discErr && discussion) {
        // Increment view count asynchronously
        try {
          await supabaseAdmin.rpc('increment_discussion_views', { p_discussion_id: discussionId });
        } catch {
          // Non-blocking
        }

        // 2. Fetch Replies
        const { data: repliesData } = await supabaseAdmin
          .from('discussion_replies')
          .select(
            `id, discussion_id, author_id, content, is_accepted_answer, is_pinned, likes_count, created_at, updated_at,
             profiles:author_id(id, full_name, avatar_url, role),
             discussion_attachments(id, file_name, file_url, file_size, file_type)`
          )
          .eq('discussion_id', discussionId)
          .order('is_accepted_answer', { ascending: false })
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: true });

        // 3. Batch check user reactions on discussion and replies
        const replyIds = (repliesData || []).map((r: any) => r.id);
        const allTargetIds = [discussionId, ...replyIds];
        const userLikedSet = new Set<string>();

        const { data: userReactions } = await supabaseAdmin
          .from('discussion_reactions')
          .select('target_id')
          .eq('user_id', userId)
          .in('target_id', allTargetIds);

        if (Array.isArray(userReactions)) {
          userReactions.forEach((r: any) => userLikedSet.add(r.target_id));
        }

        const replies = (repliesData || []).map((r: any) => this.formatReply(r, userLikedSet));
        const formattedDisc = this.formatDiscussion(discussion, userId, userLikedSet);
        formattedDisc.replies = replies;

        return formattedDisc;
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch discussion details from Supabase: ${err.message}`);
    }

    // Fallback store lookup
    const fallbackDisc = this.inMemoryDiscussions.find((d) => d.id === discussionId);
    if (!fallbackDisc) {
      throw new ApiError(404, 'Discussion not found');
    }

    fallbackDisc.viewsCount += 1;
    const replies = this.inMemoryReplies.filter((r) => r.discussionId === discussionId);
    return {
      ...fallbackDisc,
      replies,
    };
  }

  /**
   * 3. Create Discussion Thread
   */
  public static async createDiscussion(
    userId: string,
    userRole: UserRole,
    dto: CreateDiscussionDto
  ): Promise<DiscussionItem> {
    if (!dto.title?.trim() || !dto.content?.trim() || !dto.courseId) {
      throw new ApiError(400, 'Title, content, and course are required');
    }

    let courseTitle = 'Enrolled Course';
    let instructorId: string | null = null;

    try {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('id, title, instructor_id')
        .eq('id', dto.courseId)
        .single();

      if (course) {
        courseTitle = course.title;
        instructorId = course.instructor_id;
      }

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('course_discussions')
        .insert({
          course_id: dto.courseId,
          author_id: userId,
          category: dto.category,
          title: dto.title.trim(),
          content: dto.content.trim(),
        })
        .select(
          `id, course_id, author_id, category, title, content, is_pinned, is_solved, is_locked, views_count, likes_count, replies_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role),
           courses:course_id(id, title)`
        )
        .single();

      if (!insertErr && inserted) {
        // Insert attachments if present
        if (dto.attachments && dto.attachments.length > 0) {
          const attachmentsToInsert = dto.attachments.map((att) => ({
            discussion_id: inserted.id,
            file_name: att.name,
            file_url: att.url,
            file_size: att.size,
            file_type: att.type || 'other',
            uploaded_by: userId,
          }));

          await supabaseAdmin.from('discussion_attachments').insert(attachmentsToInsert);
        }

        // Dispatch notification based on role
        if (userRole === 'student' && instructorId && instructorId !== userId) {
          try {
            await NotificationService.createNotification({
              userId: instructorId,
              title: `New Discussion: ${inserted.title}`,
              message: `A student posted a question in "${courseTitle}": "${inserted.title.slice(0, 80)}"`,
              type: 'info',
              category: 'forum',
              actionUrl: '/instructor/forum',
              sourceId: inserted.id,
            });
          } catch (notifErr: any) {
            logger.warn(`Failed to dispatch discussion notification: ${notifErr.message}`);
          }
        } else if (userRole === 'instructor') {
          // Notify enrolled students when instructor creates a discussion topic
          try {
            const { data: enrollments } = await supabaseAdmin
              .from('enrollments')
              .select('student_id')
              .eq('course_id', dto.courseId)
              .in('status', ['Active', 'Completed']);

            if (Array.isArray(enrollments) && enrollments.length > 0) {
              const studentNotifs = enrollments
                .filter((e) => e.student_id && e.student_id !== userId)
                .map((e) => ({
                  userId: e.student_id,
                  title: `New Course Discussion: ${inserted.title}`,
                  message: `Your instructor posted a new topic in "${courseTitle}": "${inserted.title.slice(0, 80)}"`,
                  type: 'info' as const,
                  category: 'forum' as const,
                  actionUrl: '/student/forum',
                  sourceId: inserted.id,
                }));

              if (studentNotifs.length > 0) {
                await NotificationService.createBulkNotifications(studentNotifs);
              }
            }
          } catch (notifErr: any) {
            logger.warn(`Failed to dispatch bulk discussion notifications to students: ${notifErr.message}`);
          }
        }

        return this.formatDiscussion(inserted, userId);
      }
    } catch (err: any) {
      logger.warn(`Failed to insert discussion into Supabase: ${err.message}`);
    }

    // Fallback store insertion
    const newId = `disc-${Date.now()}`;
    const newDiscussion: DiscussionItem = {
      id: newId,
      courseId: dto.courseId,
      courseTitle,
      authorId: userId,
      authorName: userRole === 'instructor' ? 'Course Instructor' : 'Student Author',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorRole: userRole === 'instructor' ? 'instructor' : 'student',
      category: dto.category,
      title: dto.title.trim(),
      content: dto.content.trim(),
      isPinned: false,
      isSolved: false,
      isLocked: false,
      viewsCount: 1,
      likesCount: 0,
      repliesCount: 0,
      isLiked: false,
      attachments: (dto.attachments || []).map((att) => ({
        id: `att-${Date.now()}`,
        discussionId: newId,
        fileName: att.name,
        fileUrl: att.url,
        fileSize: att.size,
        fileType: att.type,
        uploadedBy: userId,
        createdAt: new Date().toISOString(),
      })),
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDiscussions.unshift(newDiscussion);
    return newDiscussion;
  }

  /**
   * 4. Update Discussion Thread (Author or Admin)
   */
  public static async updateDiscussion(
    discussionId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateDiscussionDto
  ): Promise<DiscussionItem> {
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (dto.title?.trim()) updatePayload.title = dto.title.trim();
    if (dto.content?.trim()) updatePayload.content = dto.content.trim();
    if (dto.category) updatePayload.category = dto.category;

    try {
      let query = supabaseAdmin
        .from('course_discussions')
        .update(updatePayload)
        .eq('id', discussionId);

      if (userRole !== 'admin') {
        query = query.eq('author_id', userId);
      }

      const { data, error } = await query
        .select(
          `id, course_id, author_id, category, title, content, is_pinned, is_solved, is_locked, views_count, likes_count, replies_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role),
           courses:course_id(id, title)`
        )
        .single();

      if (!error && data) {
        return this.formatDiscussion(data, userId);
      }
    } catch (err: any) {
      logger.warn(`Failed to update discussion in Supabase: ${err.message}`);
    }

    const index = this.inMemoryDiscussions.findIndex((d) => d.id === discussionId);
    if (index === -1) throw new ApiError(404, 'Discussion not found');
    if (userRole !== 'admin' && this.inMemoryDiscussions[index].authorId !== userId) {
      throw new ApiError(403, 'Permission denied');
    }

    this.inMemoryDiscussions[index] = {
      ...this.inMemoryDiscussions[index],
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    return this.inMemoryDiscussions[index];
  }

  /**
   * 5. Delete Discussion Thread (Author if 0 replies, or Instructor, or Admin)
   */
  public static async deleteDiscussion(
    discussionId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{ success: boolean; message: string }> {
    try {
      let query = supabaseAdmin.from('course_discussions').delete().eq('id', discussionId);

      if (userRole === 'student') {
        query = query.eq('author_id', userId);
      }

      const { error } = await query;
      if (!error) {
        return { success: true, message: 'Discussion deleted successfully' };
      }
    } catch (err: any) {
      logger.warn(`Failed to delete discussion from Supabase: ${err.message}`);
    }

    this.inMemoryDiscussions = this.inMemoryDiscussions.filter((d) => d.id !== discussionId);
    this.inMemoryReplies = this.inMemoryReplies.filter((r) => r.discussionId !== discussionId);
    return { success: true, message: 'Discussion deleted successfully' };
  }

  /**
   * 6. Create Reply to Discussion
   */
  public static async createReply(
    discussionId: string,
    userId: string,
    userRole: UserRole,
    dto: CreateReplyDto
  ): Promise<DiscussionReplyItem> {
    if (!dto.content?.trim()) {
      throw new ApiError(400, 'Reply content cannot be empty');
    }

    let discussionAuthorId: string | null = null;
    let discussionTitle = 'Discussion';

    try {
      const { data: discussion, error: discErr } = await supabaseAdmin
        .from('course_discussions')
        .select(`
          id, author_id, title, is_locked, course_id,
          author:author_id(id, full_name, role),
          courses:course_id(id, title, instructor_id)
        `)
        .eq('id', discussionId)
        .single();

      if (discErr || !discussion) {
        throw new ApiError(404, 'Discussion thread not found');
      }

      if (discussion.is_locked) {
        throw new ApiError(400, 'This discussion thread is locked and cannot receive new replies');
      }

      discussionAuthorId = discussion.author_id;
      discussionTitle = discussion.title;
      const courseTitle = (discussion as any).courses?.title || 'Course Discussion';
      const instructorId = (discussion as any).courses?.instructor_id;
      const authorRole = (discussion as any).author?.role || 'student';

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          author_id: userId,
          content: dto.content.trim(),
        })
        .select(
          `id, discussion_id, author_id, content, is_accepted_answer, is_pinned, likes_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role)`
        )
        .single();

      if (!insertErr && inserted) {
        if (dto.attachments && dto.attachments.length > 0) {
          const attachmentsToInsert = dto.attachments.map((att) => ({
            reply_id: inserted.id,
            file_name: att.name,
            file_url: att.url,
            file_size: att.size,
            file_type: att.type || 'other',
            uploaded_by: userId,
          }));
          await supabaseAdmin.from('discussion_attachments').insert(attachmentsToInsert);
        }

        // 1. Notify Discussion Author (if reply is by someone else)
        if (discussionAuthorId && discussionAuthorId !== userId) {
          try {
            await NotificationService.createNotification({
              userId: discussionAuthorId,
              title: `New Reply on "${discussionTitle.slice(0, 40)}"`,
              message: `${userRole === 'instructor' ? 'An instructor' : 'A peer'} replied: "${dto.content.slice(0, 80)}"`,
              type: userRole === 'instructor' ? 'success' : 'info',
              category: 'forum',
              actionUrl: authorRole === 'instructor' ? '/instructor/forum' : '/student/forum',
              sourceId: discussionId,
            });
          } catch (notifErr: any) {
            logger.warn(`Failed to dispatch reply notification: ${notifErr.message}`);
          }
        }

        // 2. Also notify Course Instructor if reply was from student and instructor wasn't author
        if (
          instructorId &&
          instructorId !== userId &&
          instructorId !== discussionAuthorId
        ) {
          try {
            await NotificationService.createNotification({
              userId: instructorId,
              title: `Discussion Activity: ${courseTitle}`,
              message: `New reply on discussion topic "${discussionTitle.slice(0, 50)}": "${dto.content.slice(0, 70)}"`,
              type: 'info',
              category: 'forum',
              actionUrl: '/instructor/forum',
              sourceId: discussionId,
            });
          } catch (notifErr: any) {
            logger.warn(`Failed to dispatch instructor forum reply notification: ${notifErr.message}`);
          }
        }

        return this.formatReply(inserted);
      }
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      logger.warn(`Failed to insert reply into Supabase: ${err.message}`);
    }

    // Fallback store reply
    const newReplyId = `rep-${Date.now()}`;
    const newReply: DiscussionReplyItem = {
      id: newReplyId,
      discussionId,
      authorId: userId,
      authorName: userRole === 'instructor' ? 'Dr. Marcus Vance' : 'Rahul Sharma',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      authorRole: userRole === 'instructor' ? 'instructor' : 'student',
      content: dto.content.trim(),
      isAcceptedAnswer: false,
      isPinned: false,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryReplies.push(newReply);
    const disc = this.inMemoryDiscussions.find((d) => d.id === discussionId);
    if (disc) {
      disc.repliesCount += 1;
    }

    return newReply;
  }

  /**
   * 7. Update Reply (Author or Admin)
   */
  public static async updateReply(
    replyId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateReplyDto
  ): Promise<DiscussionReplyItem> {
    if (!dto.content?.trim()) {
      throw new ApiError(400, 'Reply content cannot be empty');
    }

    try {
      let query = supabaseAdmin
        .from('discussion_replies')
        .update({ content: dto.content.trim(), updated_at: new Date().toISOString() })
        .eq('id', replyId);

      if (userRole !== 'admin') {
        query = query.eq('author_id', userId);
      }

      const { data, error } = await query
        .select(
          `id, discussion_id, author_id, content, is_accepted_answer, is_pinned, likes_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role)`
        )
        .single();

      if (!error && data) {
        return this.formatReply(data);
      }
    } catch (err: any) {
      logger.warn(`Failed to update reply in Supabase: ${err.message}`);
    }

    const reply = this.inMemoryReplies.find((r) => r.id === replyId);
    if (!reply) throw new ApiError(404, 'Reply not found');
    if (userRole !== 'admin' && reply.authorId !== userId) {
      throw new ApiError(403, 'Permission denied');
    }

    reply.content = dto.content.trim();
    reply.updatedAt = new Date().toISOString();
    return reply;
  }

  /**
   * 8. Delete Reply (Author, Instructor, or Admin)
   */
  public static async deleteReply(
    replyId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{ success: boolean; message: string }> {
    try {
      let query = supabaseAdmin.from('discussion_replies').delete().eq('id', replyId);
      if (userRole === 'student') {
        query = query.eq('author_id', userId);
      }

      const { error } = await query;
      if (!error) {
        return { success: true, message: 'Reply deleted successfully' };
      }
    } catch (err: any) {
      logger.warn(`Failed to delete reply from Supabase: ${err.message}`);
    }

    this.inMemoryReplies = this.inMemoryReplies.filter((r) => r.id !== replyId);
    return { success: true, message: 'Reply deleted successfully' };
  }

  /**
   * 9. Toggle Reaction (Like / Unlike)
   */
  public static async toggleReaction(
    userId: string,
    targetType: 'discussion' | 'reply',
    targetId: string
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      // Check existing reaction
      const { data: existing } = await supabaseAdmin
        .from('discussion_reactions')
        .select('id')
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabaseAdmin.from('discussion_reactions').delete().eq('id', existing.id);

        // Fetch updated count
        const table = targetType === 'discussion' ? 'course_discussions' : 'discussion_replies';
        const { data: updated } = await supabaseAdmin.from(table).select('likes_count').eq('id', targetId).single();

        return {
          isLiked: false,
          likesCount: updated ? Number(updated.likes_count) : 0,
        };
      } else {
        // Insert reaction
        await supabaseAdmin.from('discussion_reactions').insert({
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          reaction: 'like',
        });

        const table = targetType === 'discussion' ? 'course_discussions' : 'discussion_replies';
        const { data: updated } = await supabaseAdmin.from(table).select('likes_count').eq('id', targetId).single();

        return {
          isLiked: true,
          likesCount: updated ? Number(updated.likes_count) : 1,
        };
      }
    } catch (err: any) {
      logger.warn(`Failed to toggle reaction in Supabase: ${err.message}`);
    }

    // In-memory fallback
    const idx = this.inMemoryReactions.findIndex(
      (r) => r.userId === userId && r.targetType === targetType && r.targetId === targetId
    );

    if (idx !== -1) {
      this.inMemoryReactions.splice(idx, 1);
      return { isLiked: false, likesCount: 0 };
    } else {
      this.inMemoryReactions.push({
        id: `reac-${Date.now()}`,
        userId,
        targetType,
        targetId,
        createdAt: new Date().toISOString(),
      });
      return { isLiked: true, likesCount: 1 };
    }
  }

  /**
   * 10. Moderate Discussion (Pin, Solve, Lock) - Instructor or Admin
   */
  public static async moderateDiscussion(
    discussionId: string,
    userId: string,
    userRole: UserRole,
    dto: ModerateDiscussionDto
  ): Promise<DiscussionItem> {
    if (userRole !== 'instructor' && userRole !== 'admin') {
      throw new ApiError(403, 'Instructor or Admin privileges required to moderate discussions');
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (dto.isPinned !== undefined) payload.is_pinned = dto.isPinned;
    if (dto.isSolved !== undefined) payload.is_solved = dto.isSolved;
    if (dto.isLocked !== undefined) payload.is_locked = dto.isLocked;

    try {
      const { data, error } = await supabaseAdmin
        .from('course_discussions')
        .update(payload)
        .eq('id', discussionId)
        .select(
          `id, course_id, author_id, category, title, content, is_pinned, is_solved, is_locked, views_count, likes_count, replies_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role),
           courses:course_id(id, title)`
        )
        .single();

      if (!error && data) {
        // If marked solved, notify author
        if (dto.isSolved && data.author_id !== userId) {
          try {
            await NotificationService.createNotification({
              userId: data.author_id,
              title: `Discussion Solved!`,
              message: `Your question "${data.title.slice(0, 60)}" was marked as Solved by the instructor.`,
              type: 'success',
              category: 'forum',
              actionUrl: `/student/forum`,
              sourceId: data.id,
            });
          } catch {}
        }

        return this.formatDiscussion(data, userId);
      }
    } catch (err: any) {
      logger.warn(`Failed to moderate discussion in Supabase: ${err.message}`);
    }

    const disc = this.inMemoryDiscussions.find((d) => d.id === discussionId);
    if (!disc) throw new ApiError(404, 'Discussion not found');
    if (dto.isPinned !== undefined) disc.isPinned = dto.isPinned;
    if (dto.isSolved !== undefined) disc.isSolved = dto.isSolved;
    if (dto.isLocked !== undefined) disc.isLocked = dto.isLocked;
    return disc;
  }

  /**
   * 11. Moderate Reply (Pin, Mark as Accepted Answer) - Instructor or Admin
   */
  public static async moderateReply(
    replyId: string,
    _userId: string,
    userRole: UserRole,
    dto: ModerateReplyDto
  ): Promise<DiscussionReplyItem> {
    if (userRole !== 'instructor' && userRole !== 'admin') {
      throw new ApiError(403, 'Instructor or Admin privileges required to moderate replies');
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (dto.isPinned !== undefined) payload.is_pinned = dto.isPinned;
    if (dto.isAcceptedAnswer !== undefined) payload.is_accepted_answer = dto.isAcceptedAnswer;

    try {
      const { data, error } = await supabaseAdmin
        .from('discussion_replies')
        .update(payload)
        .eq('id', replyId)
        .select(
          `id, discussion_id, author_id, content, is_accepted_answer, is_pinned, likes_count, created_at, updated_at,
           profiles:author_id(id, full_name, avatar_url, role)`
        )
        .single();

      if (!error && data) {
        // If marked as accepted answer, notify the reply author
        if (dto.isAcceptedAnswer && data.author_id) {
          try {
            const rawProfiles = (data as any).profiles;
            const profileObj = Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles;
            const authorRole = profileObj?.role || 'student';

            await NotificationService.createNotification({
              userId: data.author_id,
              title: `Accepted Answer! 🎯`,
              message: `Your answer was chosen as the accepted solution by the instructor.`,
              type: 'success',
              category: 'forum',
              actionUrl: authorRole === 'instructor' ? '/instructor/forum' : '/student/forum',
              sourceId: data.discussion_id,
            });
          } catch (notifErr: any) {
            logger.warn(`Failed to dispatch accepted answer notification: ${notifErr.message}`);
          }
        }

        return this.formatReply(data);
      }
    } catch (err: any) {
      logger.warn(`Failed to moderate reply in Supabase: ${err.message}`);
    }

    const reply = this.inMemoryReplies.find((r) => r.id === replyId);
    if (!reply) throw new ApiError(404, 'Reply not found');
    if (dto.isPinned !== undefined) reply.isPinned = dto.isPinned;
    if (dto.isAcceptedAnswer !== undefined) reply.isAcceptedAnswer = dto.isAcceptedAnswer;
    return reply;
  }

  /**
   * 12. Create Moderation Report
   */
  public static async createReport(
    userId: string,
    dto: CreateModerationReportDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      await supabaseAdmin.from('discussion_moderation_reports').insert({
        reporter_id: userId,
        target_type: dto.targetType,
        target_id: dto.targetId,
        reason: dto.reason.trim(),
      });
      return { success: true, message: 'Content reported successfully for moderator review' };
    } catch (err: any) {
      logger.warn(`Failed to save moderation report to Supabase: ${err.message}`);
    }

    this.inMemoryReports.push({
      id: `rep-mod-${Date.now()}`,
      reporterId: userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: 'Content reported successfully for moderator review' };
  }

  /**
   * 13. Get Moderation Reports (Instructor or Admin)
   */
  public static async getReports(
    userRole: UserRole,
    status?: string
  ): Promise<DiscussionModerationReportItem[]> {
    if (userRole !== 'instructor' && userRole !== 'admin') {
      throw new ApiError(403, 'Permission denied');
    }

    try {
      let query = supabaseAdmin
        .from('discussion_moderation_reports')
        .select(
          `id, reporter_id, target_type, target_id, reason, status, reviewed_by, resolution_notes, created_at, resolved_at,
           profiles:reporter_id(id, full_name, email)`
        )
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data.map((r: any) => ({
          id: r.id,
          reporterId: r.reporter_id,
          reporterName: r.profiles?.full_name || 'Anonymous User',
          reporterEmail: r.profiles?.email,
          targetType: r.target_type,
          targetId: r.target_id,
          reason: r.reason,
          status: r.status,
          reviewedBy: r.reviewed_by,
          resolutionNotes: r.resolution_notes,
          createdAt: r.created_at,
          resolvedAt: r.resolved_at,
        }));
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch moderation reports from Supabase: ${err.message}`);
    }

    return this.inMemoryReports;
  }

  /**
   * 14. Resolve Moderation Report (Instructor or Admin)
   */
  public static async resolveReport(
    reportId: string,
    userId: string,
    userRole: UserRole,
    dto: ResolveModerationReportDto
  ): Promise<{ success: boolean; message: string }> {
    if (userRole !== 'instructor' && userRole !== 'admin') {
      throw new ApiError(403, 'Permission denied');
    }

    try {
      const { error } = await supabaseAdmin
        .from('discussion_moderation_reports')
        .update({
          status: dto.status,
          resolution_notes: dto.resolutionNotes,
          reviewed_by: userId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (!error) {
        return { success: true, message: `Report marked as ${dto.status}` };
      }
    } catch (err: any) {
      logger.warn(`Failed to resolve report in Supabase: ${err.message}`);
    }

    const rep = this.inMemoryReports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = dto.status;
      rep.resolutionNotes = dto.resolutionNotes;
      rep.reviewedBy = userId;
      rep.resolvedAt = new Date().toISOString();
    }

    return { success: true, message: `Report marked as ${dto.status}` };
  }
}

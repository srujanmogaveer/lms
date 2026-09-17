import crypto from 'crypto';
import { AccessToken } from 'livekit-server-sdk';
import { supabaseAdmin } from '../config/supabase';
import { config } from '../config/env';
import { ApiError } from '../utils/apiResponse';
import {
  LiveClassItem,
  LiveClassQAItem,
  LiveClassParticipantItem,
  LiveClassPaginatedResult,
  LiveClassJoinResult,
  CreateLiveClassDto,
  UpdateLiveClassDto,
  RescheduleLiveClassDto,
  LiveClassFilterParams,
  LiveClassStatus,
} from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class LiveClassService {
  /**
   * Generates a signed LiveKit AccessToken for WebRTC media room access
   */
  private async generateLiveKitToken(
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    userRole: string,
    roomName: string,
    isHost: boolean
  ): Promise<string> {
    try {
      const apiKey = config.livekit.apiKey;
      const apiSecret = config.livekit.apiSecret;

      const at = new AccessToken(apiKey, apiSecret, {
        identity: userId,
        name: userName,
        metadata: JSON.stringify({
          role: userRole,
          avatar: userAvatar || '',
        }),
        ttl: '6h',
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        roomAdmin: isHost,
      });

      return await at.toJwt();
    } catch (err: any) {
      logger.error('Failed to generate LiveKit AccessToken:', err);
      return '';
    }
  }
  /**
   * Evaluates dynamic class status according to time rules:
   * - Cancelled stays Cancelled
   * - Draft stays Draft
   * - Otherwise:
   *   - now < start_time -> 'Scheduled'
   *   - now >= start_time && now <= end_time -> 'Live'
   *   - now > end_time -> 'Completed'
   */
  private computeStatus(rawStatus: LiveClassStatus, startTime: string, endTime: string): LiveClassStatus {
    if (rawStatus === 'Cancelled' || rawStatus === 'Draft' || rawStatus === 'Completed') {
      return rawStatus;
    }

    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (!isNaN(start) && !isNaN(end)) {
      if (now < start) return 'Scheduled';
      if (now >= start && now <= end) return 'Live';
      if (now > end) return 'Completed';
    }

    return rawStatus;
  }

  /**
   * Helper to format DB live_classes row into standard LiveClassItem
   */
  private formatLiveClass(row: any): LiveClassItem {
    const course = row.courses;
    const instructor = row.profiles;
    const computedStatus = this.computeStatus(row.status, row.start_time, row.end_time);

    return {
      id: row.id,
      courseId: row.course_id,
      courseTitle: course?.title || row.course_title || 'Untitled Course',
      instructorId: row.instructor_id,
      instructorName: instructor?.full_name || row.instructor_name || 'Instructor',
      instructorAvatar: instructor?.avatar_url || row.instructor_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      instructorRole: instructor?.headline || 'Course Instructor',
      title: row.title,
      description: row.description || '',
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: Number(row.duration_minutes) || 60,
      platform: row.platform || 'Google Meet',
      meetingUrl: row.meeting_url,
      meetingId: row.meeting_id || undefined,
      passcode: row.passcode || undefined,
      status: computedStatus,
      audienceType: row.audience_type || 'All Enrolled Students',
      selectedStudentIds: Array.isArray(row.selected_student_ids) ? row.selected_student_ids : [],
      selectedStudentNames: row.selected_student_names || undefined,
      instructions: row.instructions || '',
      resources: Array.isArray(row.resources) ? row.resources : [],
      recordingUrl: row.recording_url || undefined,
      isRecordingAvailable: Boolean(row.is_recording_available && row.recording_url),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      enrolledStudentsCount: row.enrolled_count !== undefined ? Number(row.enrolled_count) : undefined,
      questionsCount: row.questions_count !== undefined ? Number(row.questions_count) : undefined,
    };
  }

  /**
   * Check for overlapping classes for the same instructor
   */
  private async checkInstructorOverlap(
    instructorId: string,
    startTime: string,
    endTime: string,
    excludeClassId?: string
  ): Promise<void> {
    let query = supabaseAdmin
      .from('live_classes')
      .select('id, title, start_time, end_time')
      .eq('instructor_id', instructorId)
      .neq('status', 'Cancelled')
      .neq('status', 'Draft');

    if (excludeClassId) {
      query = query.neq('id', excludeClassId);
    }

    const { data: existingClasses, error } = await query;
    if (error || !existingClasses) return;

    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();

    for (const c of existingClasses) {
      const cStart = new Date(c.start_time).getTime();
      const cEnd = new Date(c.end_time).getTime();

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      if (newStart < cEnd && newEnd > cStart) {
        throw ApiError.conflict(
          `You already have another live class "${c.title}" scheduled from ${new Date(c.start_time).toLocaleTimeString()} to ${new Date(c.end_time).toLocaleTimeString()}`
        );
      }
    }
  }

  /**
   * Validate that all selected students have active enrollments in the course
   */
  private async validateSelectedStudents(courseId: string, studentIds: string[]): Promise<void> {
    if (!studentIds || studentIds.length === 0) return;

    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId)
      .neq('status', 'Cancelled')
      .in('student_id', studentIds);

    if (error) {
      logger.error('Error validating selected students enrollments:', error);
      throw ApiError.internal('Failed to validate student enrollments');
    }

    const enrolledSet = new Set((enrollments || []).map((e) => e.student_id));
    const missingStudents = studentIds.filter((id) => !enrolledSet.has(id));

    if (missingStudents.length > 0) {
      throw ApiError.badRequest(
        `Cannot create private class: ${missingStudents.length} selected student(s) are not enrolled in this course`
      );
    }
  }

  // ============================================================
  // INSTRUCTOR METHODS
  // ============================================================

  /**
   * 1. Create a new Live Class (Instructor)
   */
  public async createLiveClass(
    instructorId: string,
    courseId: string,
    dto: CreateLiveClassDto
  ): Promise<LiveClassItem> {
    // 1. Verify Instructor owns this course
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseErr || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.instructor_id !== instructorId) {
      throw ApiError.forbidden('You can only schedule live classes for courses you own');
    }

    // 2. Validate Selected Students if audience is Selected Students
    const audienceType = dto.audienceType || 'All Enrolled Students';
    const selectedStudentIds = audienceType === 'Selected Students' ? (dto.selectedStudentIds || []) : [];

    if (audienceType === 'Selected Students') {
      if (selectedStudentIds.length === 0) {
        throw ApiError.badRequest('At least one student must be selected for a private live class');
      }
      await this.validateSelectedStudents(courseId, selectedStudentIds);
    }

    // 3. Validate Time Interval
    const startTime = new Date(dto.startTime).toISOString();
    const endTime = new Date(dto.endTime).toISOString();
    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      throw ApiError.badRequest('End time must be after start time');
    }

    // 4. Check for overlapping classes for this instructor
    if (dto.status !== 'Draft') {
      await this.checkInstructorOverlap(instructorId, startTime, endTime);
    }

    const durationMinutes =
      dto.durationMinutes ||
      Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)));

    // 5. Generate Permanent Class UUID and Internal Room Name
    const classId = crypto.randomUUID();
    const platform = dto.platform || 'In-App Live Classroom';
    const roomName = `edusphere-${classId}`;
    const meetingUrl = dto.meetingUrl?.trim() || `/student/live/room/${classId}`;
    const meetingId = dto.meetingId?.trim() || roomName;
    const isRecordingAvailable = Boolean(dto.recordingUrl && dto.recordingUrl.trim());

    // 6. Insert into Database
    const { data: createdRow, error: insertErr } = await supabaseAdmin
      .from('live_classes')
      .insert({
        id: classId,
        course_id: courseId,
        instructor_id: instructorId,
        title: dto.title.trim(),
        description: dto.description || '',
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        platform: platform,
        meeting_url: meetingUrl,
        meeting_id: meetingId,
        passcode: dto.passcode?.trim() || null,
        status: dto.status || 'Scheduled',
        audience_type: audienceType,
        selected_student_ids: selectedStudentIds,
        instructions: dto.instructions || '',
        resources: dto.resources || [],
        recording_url: dto.recordingUrl?.trim() || null,
        is_recording_available: isRecordingAvailable,
      })
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .single();

    if (insertErr || !createdRow) {
      logger.error('Failed to insert live class:', insertErr);
      throw ApiError.internal(insertErr?.message || 'Failed to create live class');
    }

    // Dispatch notification to enrolled students (asynchronous & non-blocking)
    try {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .in('status', ['Active', 'Completed']);

      if (enrollments && enrollments.length > 0) {
        const courseTitle = (createdRow.courses as any)?.title || 'Course';
        const scheduledTimeStr = new Date(createdRow.start_time).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const notifications = enrollments.map((e) => ({
          userId: e.student_id,
          title: `Live Class Scheduled: ${createdRow.title}`,
          message: `A live class for "${courseTitle}" is scheduled on ${scheduledTimeStr}.`,
          type: 'info' as const,
          category: 'live_class' as const,
          actionUrl: '/student/live',
          sourceId: classId,
        }));
        await NotificationService.createBulkNotifications(notifications);
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch live class notifications: ${notifErr.message}`);
    }

    return this.formatLiveClass(createdRow);
  }


  /**
   * 2. List all Live Classes for an Instructor
   */
  public async getInstructorLiveClasses(
    instructorId: string,
    filters: LiveClassFilterParams = {}
  ): Promise<{ liveClasses: LiveClassItem[]; total: number }> {
    let query = supabaseAdmin
      .from('live_classes')
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)', { count: 'exact' })
      .eq('instructor_id', instructorId)
      .order('start_time', { ascending: false });

    if (filters.courseId && filters.courseId !== 'all') {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters.status && filters.status !== 'all' && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    if (filters.search && filters.search.trim()) {
      query = query.ilike('title', `%${filters.search.trim()}%`);
    }

    const { data: rows, count, error } = await query;

    if (error) {
      logger.error('Error fetching instructor live classes:', error);
      throw ApiError.internal('Failed to fetch live classes');
    }

    // Fetch enrolled students count for each course to populate UI metadata
    const liveClasses = (rows || []).map((r) => this.formatLiveClass(r));

    return {
      liveClasses,
      total: count || liveClasses.length,
    };
  }

  /**
   * 2b. Get Single Live Class Details for Instructor
   * Verifies instructor owns the live class
   */
  public async getInstructorLiveClassDetails(instructorId: string, classId: string): Promise<LiveClassItem> {
    const { data: row, error } = await supabaseAdmin
      .from('live_classes')
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .eq('id', classId)
      .maybeSingle();

    if (error || !row) {
      throw ApiError.notFound('Live class not found');
    }

    if (row.instructor_id !== instructorId) {
      throw ApiError.forbidden('You can only access your own live class session');
    }

    return this.formatLiveClass(row);
  }

  /**
   * 3. Update Live Class (Instructor)
   * Enforces:
   * - Only Scheduled (or Draft) classes can be edited.
   * - Live classes cannot be edited (only ending session is allowed).
   * - Completed and Cancelled classes cannot be edited.
   */
  public async updateLiveClass(
    instructorId: string,
    classId: string,
    dto: UpdateLiveClassDto
  ): Promise<LiveClassItem> {
    // Verify ownership
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('live_classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle();

    if (findErr || !existing) {
      throw ApiError.notFound('Live class not found');
    }

    if (existing.instructor_id !== instructorId) {
      throw ApiError.forbidden('You can only edit your own live classes');
    }

    const currentStatus = this.computeStatus(existing.status, existing.start_time, existing.end_time);

    if (currentStatus === 'Cancelled') {
      throw ApiError.badRequest('Cancelled classes cannot be edited or modified');
    }

    if (currentStatus === 'Completed') {
      throw ApiError.badRequest('Completed classes cannot be edited or modified');
    }

    if (currentStatus === 'Live') {
      // Check if this is exclusively an "End Session" action (marking status as 'Completed')
      const isEndingSession = dto.status === 'Completed';
      const isModifyingRestrictedFields =
        dto.title !== undefined ||
        dto.courseId !== undefined ||
        dto.startTime !== undefined ||
        dto.endTime !== undefined ||
        dto.platform !== undefined ||
        dto.meetingUrl !== undefined ||
        dto.meetingId !== undefined ||
        dto.audienceType !== undefined ||
        dto.selectedStudentIds !== undefined;

      if (!isEndingSession || isModifyingRestrictedFields) {
        throw ApiError.badRequest('Live classes cannot be edited while in progress. You can only end the session.');
      }
    }

    const targetCourseId = dto.courseId || existing.course_id;

    // If changing course, verify instructor owns the new course
    if (dto.courseId && dto.courseId !== existing.course_id) {
      const { data: course, error: cErr } = await supabaseAdmin
        .from('courses')
        .select('id, instructor_id')
        .eq('id', dto.courseId)
        .maybeSingle();

      if (cErr || !course || course.instructor_id !== instructorId) {
        throw ApiError.forbidden('You can only move live classes to courses you own');
      }
    }

    // Validate Audience and Selected Students
    const targetAudience = dto.audienceType || existing.audience_type;
    let targetSelectedStudents = existing.selected_student_ids;

    if (dto.audienceType !== undefined || dto.selectedStudentIds !== undefined) {
      if (targetAudience === 'Selected Students') {
        targetSelectedStudents = dto.selectedStudentIds !== undefined ? dto.selectedStudentIds : existing.selected_student_ids;
        if (!targetSelectedStudents || targetSelectedStudents.length === 0) {
          throw ApiError.badRequest('At least one student must be selected for a private live class');
        }
        await this.validateSelectedStudents(targetCourseId, targetSelectedStudents);
      } else {
        targetSelectedStudents = [];
      }
    }

    // Validate Time & Overlap
    const startTime = dto.startTime ? new Date(dto.startTime).toISOString() : existing.start_time;
    const endTime = dto.endTime ? new Date(dto.endTime).toISOString() : existing.end_time;

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      throw ApiError.badRequest('End time must be after start time');
    }

    if (dto.status !== 'Draft' && (dto.startTime || dto.endTime)) {
      await this.checkInstructorOverlap(instructorId, startTime, endTime, classId);
    }

    const durationMinutes =
      dto.durationMinutes ||
      Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)));

    const recordingUrl = dto.recordingUrl !== undefined ? (dto.recordingUrl?.trim() || null) : existing.recording_url;
    const isRecordingAvailable = dto.isRecordingAvailable !== undefined ? dto.isRecordingAvailable : Boolean(recordingUrl);

    const platform = dto.platform || existing.platform || 'In-App Live Classroom';
    const roomName = `edusphere-${classId}`;
    let meetingUrl = dto.meetingUrl !== undefined ? dto.meetingUrl.trim() : existing.meeting_url || `/student/live/room/${classId}`;
    let meetingId = dto.meetingId !== undefined ? (dto.meetingId?.trim() || null) : existing.meeting_id || roomName;

    const updatePayload: any = {
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      course_id: targetCourseId,
      description: dto.description !== undefined ? dto.description : existing.description,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      platform: platform,
      meeting_url: meetingUrl,
      meeting_id: meetingId,
      passcode: dto.passcode !== undefined ? (dto.passcode?.trim() || null) : existing.passcode,
      status: dto.status || existing.status,
      audience_type: targetAudience,
      selected_student_ids: targetSelectedStudents,
      instructions: dto.instructions !== undefined ? dto.instructions : existing.instructions,
      resources: dto.resources !== undefined ? dto.resources : existing.resources,
      recording_url: recordingUrl,
      is_recording_available: isRecordingAvailable,
    };

    const { data: updatedRow, error: updateErr } = await supabaseAdmin
      .from('live_classes')
      .update(updatePayload)
      .eq('id', classId)
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .single();

    if (updateErr || !updatedRow) {
      logger.error('Failed to update live class:', updateErr);
      throw ApiError.internal('Failed to update live class');
    }

    return this.formatLiveClass(updatedRow);
  }

  /**
   * 4. Reschedule Live Class (Instructor)
   * Only Scheduled classes can be rescheduled.
   */
  public async rescheduleLiveClass(
    instructorId: string,
    classId: string,
    dto: RescheduleLiveClassDto
  ): Promise<LiveClassItem> {
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('live_classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle();

    if (findErr || !existing) {
      throw ApiError.notFound('Live class not found');
    }

    if (existing.instructor_id !== instructorId) {
      throw ApiError.forbidden('You can only reschedule your own live classes');
    }

    const currentStatus = this.computeStatus(existing.status, existing.start_time, existing.end_time);

    if (currentStatus !== 'Scheduled' && existing.status !== 'Draft') {
      throw ApiError.badRequest(`Cannot reschedule class with status "${currentStatus}". Only Scheduled classes can be rescheduled.`);
    }

    const startTime = new Date(dto.startTime).toISOString();
    const endTime = new Date(dto.endTime).toISOString();

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      throw ApiError.badRequest('End time must be after start time');
    }

    await this.checkInstructorOverlap(instructorId, startTime, endTime, classId);

    const durationMinutes =
      dto.durationMinutes ||
      Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)));

    const { data: updatedRow, error: updateErr } = await supabaseAdmin
      .from('live_classes')
      .update({
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        status: 'Scheduled',
      })
      .eq('id', classId)
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .single();

    if (updateErr || !updatedRow) {
      logger.error('Failed to reschedule live class:', updateErr);
      throw ApiError.internal('Failed to reschedule live class');
    }

    return this.formatLiveClass(updatedRow);
  }

  /**
   * 5. Cancel Live Class (Instructor or Admin)
   */
  public async cancelLiveClass(userId: string, userRole: string, classId: string): Promise<LiveClassItem> {
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('live_classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle();

    if (findErr || !existing) {
      throw ApiError.notFound('Live class not found');
    }

    if (userRole !== 'admin' && existing.instructor_id !== userId) {
      throw ApiError.forbidden('You can only cancel your own live classes');
    }

    const currentStatus = this.computeStatus(existing.status, existing.start_time, existing.end_time);

    if (currentStatus === 'Completed') {
      throw ApiError.badRequest('Completed classes cannot be cancelled');
    }

    if (currentStatus === 'Cancelled') {
      throw ApiError.badRequest('Class is already cancelled');
    }

    if (currentStatus === 'Live' && userRole !== 'admin') {
      throw ApiError.badRequest('Live classes cannot be cancelled while in progress. Please use end session instead.');
    }

    const { data: updatedRow, error: updateErr } = await supabaseAdmin
      .from('live_classes')
      .update({ status: 'Cancelled' })
      .eq('id', classId)
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .single();

    if (updateErr || !updatedRow) {
      logger.error('Failed to cancel live class:', updateErr);
      throw ApiError.internal('Failed to cancel live class');
    }

    return this.formatLiveClass(updatedRow);
  }

  /**
   * 5b. Authorize Live Class Join / Start
   * Generates a signed LiveKit WebRTC AccessToken and returns room parameters
   */
  public async joinLiveClass(userId: string, userRole: string, classId: string): Promise<LiveClassJoinResult> {
    const { data: row, error } = await supabaseAdmin
      .from('live_classes')
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .eq('id', classId)
      .maybeSingle();

    if (error || !row) {
      throw ApiError.notFound('Live class not found');
    }

    const currentStatus = this.computeStatus(row.status, row.start_time, row.end_time);

    if (currentStatus === 'Completed') {
      throw ApiError.badRequest('This live class session has ended and can no longer be joined');
    }

    if (currentStatus === 'Cancelled') {
      throw ApiError.badRequest('This live class session has been cancelled');
    }

    if (currentStatus === 'Draft') {
      throw ApiError.badRequest('This live class session is not yet published');
    }

    // Fetch user profile for name and avatar
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const userName = userProfile?.full_name || (userRole === 'instructor' ? 'Instructor' : 'Student');
    const userAvatar = userProfile?.avatar_url || undefined;

    if (userRole === 'instructor') {
      if (row.instructor_id !== userId) {
        throw ApiError.forbidden('You can only start/join your own live classes');
      }
    } else if (userRole === 'student') {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('course_id', row.course_id)
        .eq('student_id', userId)
        .neq('status', 'Cancelled')
        .maybeSingle();

      if (!enrollment) {
        throw ApiError.forbidden('You are not enrolled in the course for this live class');
      }

      if (row.audience_type === 'Selected Students') {
        const allowed = Array.isArray(row.selected_student_ids) && row.selected_student_ids.includes(userId);
        if (!allowed) {
          throw ApiError.forbidden('You are not authorized to join this private live session');
        }
      }
    }

    const roomName = `edusphere-${row.id}`;
    const isHost = userRole === 'instructor' || userRole === 'admin';

    // Generate cryptographic LiveKit JWT token
    const token = await this.generateLiveKitToken(
      userId,
      userName,
      userAvatar,
      userRole,
      roomName,
      isHost
    );

    return {
      id: row.id,
      title: row.title,
      status: currentStatus,
      platform: 'In-App Live Classroom',
      meetingUrl: `/student/live/room/${row.id}`,
      meetingId: roomName,
      roomName: roomName,
      isHost: isHost,
      token: token,
      serverUrl: config.livekit.url,
    };
  }

  /**
   * 6. Delete Live Class (Instructor or Admin)
   */
  public async deleteLiveClass(userId: string, userRole: string, classId: string): Promise<{ success: boolean; id: string }> {
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('live_classes')
      .select('id, instructor_id, title')
      .eq('id', classId)
      .maybeSingle();

    if (findErr || !existing) {
      throw ApiError.notFound('Live class not found');
    }

    if (userRole !== 'admin' && existing.instructor_id !== userId) {
      throw ApiError.forbidden('You can only delete your own live classes');
    }

    const { error: delErr } = await supabaseAdmin
      .from('live_classes')
      .delete()
      .eq('id', classId);

    if (delErr) {
      logger.error('Failed to delete live class:', delErr);
      throw ApiError.internal('Failed to delete live class');
    }

    return { success: true, id: classId };
  }

  // ============================================================
  // PARTICIPANT TRACKING METHODS
  // ============================================================

  /**
   * Record a participant joining a live class.
   * Uses UPSERT (ON CONFLICT DO UPDATE) so repeated page mounts
   * update joined_at and clear left_at rather than creating duplicates.
   */
  public async recordParticipantJoin(
    userId: string,
    userRole: string,
    classId: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('live_class_participants')
        .upsert(
          {
            class_id: classId,
            user_id: userId,
            role: userRole as 'student' | 'instructor' | 'admin',
            joined_at: new Date().toISOString(),
            left_at: null,
          },
          {
            onConflict: 'class_id,user_id',
            ignoreDuplicates: false,
          }
        );
    } catch (err) {
      // Non-critical: log but do not throw — participant tracking must not block classroom access
      logger.warn(`Failed to record participant join for class ${classId}:`, err);
    }
  }

  /**
   * Record a participant leaving a live class.
   * Updates the existing participant record with left_at timestamp.
   */
  public async recordParticipantLeave(
    userId: string,
    classId: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('live_class_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('class_id', classId)
        .eq('user_id', userId)
        .is('left_at', null); // Only update if still marked as active
    } catch (err) {
      logger.warn(`Failed to record participant leave for class ${classId}:`, err);
    }
  }

  /**
   * Get participants for a live class.
   * Instructor sees all participants; student sees only their own record.
   */
  public async getClassParticipants(
    userId: string,
    userRole: string,
    classId: string
  ): Promise<LiveClassParticipantItem[]> {
    // Verify the class exists
    const { data: liveClass, error: lcErr } = await supabaseAdmin
      .from('live_classes')
      .select('id, instructor_id')
      .eq('id', classId)
      .maybeSingle();

    if (lcErr || !liveClass) {
      throw ApiError.notFound('Live class not found');
    }

    // Authorization: only admin or the class instructor can see all participants
    if (userRole === 'instructor' && liveClass.instructor_id !== userId) {
      throw ApiError.forbidden('You can only view participants for your own live classes');
    }

    let query = supabaseAdmin
      .from('live_class_participants')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('class_id', classId)
      .order('joined_at', { ascending: true });

    // Students can only see their own record
    if (userRole === 'student') {
      query = query.eq('user_id', userId);
    }

    const { data: rows, error } = await query;

    if (error) {
      logger.error('Error fetching class participants:', error);
      throw ApiError.internal('Failed to fetch participants');
    }

    return (rows || []).map((r) => ({
      id: r.id,
      classId: r.class_id,
      userId: r.user_id,
      userName: r.profiles?.full_name || 'Participant',
      userAvatar: r.profiles?.avatar_url || undefined,
      role: r.role as 'student' | 'instructor' | 'admin',
      joinedAt: r.joined_at,
      leftAt: r.left_at || null,
      isActive: r.left_at === null,
    }));
  }

  // ============================================================
  // STUDENT METHODS (STRICT ENROLLMENT ISOLATION)
  // ============================================================

  /**
   * 7. List Live Classes for Enrolled Student
   * Enforces:
   * - Active enrollment in course
   * - status != 'Draft'
   * - Audience match ('All Enrolled Students' OR auth.uid() IN selected_student_ids)
   */
  public async getStudentEnrolledLiveClasses(
    studentId: string,
    filters: LiveClassFilterParams = {}
  ): Promise<{ liveClasses: LiveClassItem[]; total: number }> {
    // 1. Get all valid enrolled course IDs for this student (Active or Completed)
    const { data: enrollments, error: enrErr } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .neq('status', 'Cancelled');

    if (enrErr) {
      logger.error('Error fetching student enrollments:', enrErr);
      throw ApiError.internal('Failed to verify student enrollments');
    }

    const courseIds = (enrollments || []).map((e) => e.course_id);

    if (courseIds.length === 0) {
      return { liveClasses: [], total: 0 };
    }

    // 2. Fetch live classes for enrolled courses (exclude Draft and Cancelled — not relevant to students)
    let query = supabaseAdmin
      .from('live_classes')
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)', { count: 'exact' })
      .in('course_id', courseIds)
      .neq('status', 'Draft')
      .neq('status', 'Cancelled')
      .order('start_time', { ascending: true });

    if (filters.courseId && filters.courseId !== 'all') {
      // Ensure requested course is among student's enrolled courses
      if (!courseIds.includes(filters.courseId)) {
        return { liveClasses: [], total: 0 };
      }
      query = query.eq('course_id', filters.courseId);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search && filters.search.trim()) {
      query = query.ilike('title', `%${filters.search.trim()}%`);
    }

    const { data: rows, count, error } = await query;

    if (error) {
      logger.error('Error fetching student live classes:', error);
      throw ApiError.internal('Failed to fetch live classes');
    }

    // 3. Filter out private classes where student is not in selected_student_ids
    const visibleClasses = (rows || []).filter((r) => {
      if (r.audience_type === 'Selected Students') {
        return Array.isArray(r.selected_student_ids) && r.selected_student_ids.includes(studentId);
      }
      return true;
    }).map((r) => this.formatLiveClass(r));

    return {
      liveClasses: visibleClasses,
      total: count || visibleClasses.length,
    };
  }

  /**
   * 8. Get Single Live Class Details for Student
   * Strict authorization verification before returning meeting credentials
   */
  public async getStudentLiveClassDetails(studentId: string, classId: string): Promise<LiveClassItem> {
    const { data: row, error } = await supabaseAdmin
      .from('live_classes')
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)')
      .eq('id', classId)
      .maybeSingle();

    if (error || !row || row.status === 'Draft') {
      throw ApiError.notFound('Live class not found or unavailable');
    }

    // Verify Valid Enrollment (Active or Completed)
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', row.course_id)
      .eq('student_id', studentId)
      .neq('status', 'Cancelled')
      .maybeSingle();

    if (!enrollment) {
      throw ApiError.forbidden('You are not enrolled in the course for this live class');
    }

    // Verify Private Audience
    if (row.audience_type === 'Selected Students') {
      const allowed = Array.isArray(row.selected_student_ids) && row.selected_student_ids.includes(studentId);
      if (!allowed) {
        throw ApiError.forbidden('You are not authorized to access this private live session');
      }
    }

    return this.formatLiveClass(row);
  }

  // ============================================================
  // ADMIN METHODS
  // ============================================================

  /**
   * 9. Global Live Classes List for Admin (paginated)
   */
  public async getAdminLiveClasses(
    filters: LiveClassFilterParams = {}
  ): Promise<LiveClassPaginatedResult> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(10, filters.limit || 20));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('live_classes')
      .select('*, courses(id, title), profiles(id, full_name, avatar_url, headline)', { count: 'exact' })
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.instructorId && filters.instructorId !== 'all') {
      query = query.eq('instructor_id', filters.instructorId);
    }

    if (filters.courseId && filters.courseId !== 'all') {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search && filters.search.trim()) {
      query = query.ilike('title', `%${filters.search.trim()}%`);
    }

    const { data: rows, count, error } = await query;

    if (error) {
      logger.error('Error fetching admin live classes:', error);
      throw ApiError.internal('Failed to fetch live classes');
    }

    const liveClasses = (rows || []).map((r) => this.formatLiveClass(r));
    const total = count || 0;

    return {
      liveClasses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================
  // Q&A METHODS
  // ============================================================

  /**
   * 10. Get Questions for a Live Class
   */
  public async getQuestions(classId: string, userId: string, userRole: string): Promise<LiveClassQAItem[]> {
    // 1. Verify User Access to this class
    const { data: liveClass, error: lcErr } = await supabaseAdmin
      .from('live_classes')
      .select('id, course_id, instructor_id, status, audience_type, selected_student_ids')
      .eq('id', classId)
      .maybeSingle();

    if (lcErr || !liveClass) {
      throw ApiError.notFound('Live class not found');
    }

    if (userRole === 'instructor' && liveClass.instructor_id !== userId) {
      throw ApiError.forbidden('You do not have permission to view Q&A for this class');
    }

    if (userRole === 'student') {
      const { data: enr } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('course_id', liveClass.course_id)
        .eq('student_id', userId)
        .neq('status', 'Cancelled')
        .maybeSingle();

      if (!enr) {
        throw ApiError.forbidden('You must be enrolled in the course to view Q&A');
      }

      if (liveClass.audience_type === 'Selected Students') {
        const allowed = Array.isArray(liveClass.selected_student_ids) && liveClass.selected_student_ids.includes(userId);
        if (!allowed) {
          throw ApiError.forbidden('You are not authorized to view Q&A for this private session');
        }
      }
    }

    // 2. Fetch Questions
    const { data: rows, error } = await supabaseAdmin
      .from('live_class_qa')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('class_id', classId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching live class Q&A:', error);
      throw ApiError.internal('Failed to fetch Q&A questions');
    }

    return (rows || []).map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      studentName: r.profiles?.full_name || 'Student',
      studentAvatar: r.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      questionText: r.question_text,
      likesCount: Number(r.likes_count) || 0,
      isPinned: Boolean(r.is_pinned),
      isAnswered: Boolean(r.is_answered),
      instructorReply: r.instructor_reply || undefined,
      instructorReplyAt: r.instructor_reply_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  /**
   * 11. Student Ask Question
   */
  public async askQuestion(studentId: string, classId: string, questionText: string): Promise<LiveClassQAItem> {
    const { data: liveClass, error: lcErr } = await supabaseAdmin
      .from('live_classes')
      .select('id, course_id, status, audience_type, selected_student_ids')
      .eq('id', classId)
      .maybeSingle();

    if (lcErr || !liveClass || liveClass.status === 'Draft' || liveClass.status === 'Cancelled') {
      throw ApiError.badRequest('Cannot ask questions for an inactive or cancelled live class');
    }

    // Verify Enrollment (Active or Completed)
    const { data: enr } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', liveClass.course_id)
      .eq('student_id', studentId)
      .neq('status', 'Cancelled')
      .maybeSingle();

    if (!enr) {
      throw ApiError.forbidden('You must be enrolled in the course to ask questions');
    }

    if (liveClass.audience_type === 'Selected Students') {
      const allowed = Array.isArray(liveClass.selected_student_ids) && liveClass.selected_student_ids.includes(studentId);
      if (!allowed) {
        throw ApiError.forbidden('You are not authorized for this private live session');
      }
    }

    const { data: createdRow, error } = await supabaseAdmin
      .from('live_class_qa')
      .insert({
        class_id: classId,
        student_id: studentId,
        question_text: questionText.trim(),
        likes_count: 0,
        is_pinned: false,
        is_answered: false,
      })
      .select('*, profiles(id, full_name, avatar_url)')
      .single();

    if (error || !createdRow) {
      logger.error('Failed to post live class question:', error);
      throw ApiError.internal('Failed to post question');
    }

    return {
      id: createdRow.id,
      classId: createdRow.class_id,
      studentId: createdRow.student_id,
      studentName: createdRow.profiles?.full_name || 'Student',
      studentAvatar: createdRow.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      questionText: createdRow.question_text,
      likesCount: 0,
      isPinned: false,
      isAnswered: false,
      createdAt: createdRow.created_at,
      updatedAt: createdRow.updated_at,
    };
  }

  /**
   * 12. Instructor Reply to Question
   */
  public async replyToQuestion(
    instructorId: string,
    classId: string,
    questionId: string,
    replyText: string
  ): Promise<LiveClassQAItem> {
    const { data: liveClass } = await supabaseAdmin
      .from('live_classes')
      .select('id, instructor_id')
      .eq('id', classId)
      .maybeSingle();

    if (!liveClass || liveClass.instructor_id !== instructorId) {
      throw ApiError.forbidden('You can only reply to questions for your own live classes');
    }

    const { data: updatedRow, error } = await supabaseAdmin
      .from('live_class_qa')
      .update({
        instructor_reply: replyText.trim(),
        instructor_reply_at: new Date().toISOString(),
        is_answered: true,
      })
      .eq('id', questionId)
      .eq('class_id', classId)
      .select('*, profiles(id, full_name, avatar_url)')
      .single();

    if (error || !updatedRow) {
      logger.error('Failed to reply to live class question:', error);
      throw ApiError.internal('Failed to save reply');
    }

    return {
      id: updatedRow.id,
      classId: updatedRow.class_id,
      studentId: updatedRow.student_id,
      studentName: updatedRow.profiles?.full_name || 'Student',
      studentAvatar: updatedRow.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      questionText: updatedRow.question_text,
      likesCount: Number(updatedRow.likes_count) || 0,
      isPinned: Boolean(updatedRow.is_pinned),
      isAnswered: true,
      instructorReply: updatedRow.instructor_reply,
      instructorReplyAt: updatedRow.instructor_reply_at,
      createdAt: updatedRow.created_at,
      updatedAt: updatedRow.updated_at,
    };
  }

  /**
   * 13. Toggle Question Pin (Instructor)
   */
  public async togglePinQuestion(instructorId: string, classId: string, questionId: string): Promise<LiveClassQAItem> {
    const { data: liveClass } = await supabaseAdmin
      .from('live_classes')
      .select('id, instructor_id')
      .eq('id', classId)
      .maybeSingle();

    if (!liveClass || liveClass.instructor_id !== instructorId) {
      throw ApiError.forbidden('You can only pin questions for your own live classes');
    }

    const { data: current } = await supabaseAdmin
      .from('live_class_qa')
      .select('is_pinned')
      .eq('id', questionId)
      .eq('class_id', classId)
      .maybeSingle();

    if (!current) {
      throw ApiError.notFound('Question not found');
    }

    const { data: updatedRow, error } = await supabaseAdmin
      .from('live_class_qa')
      .update({ is_pinned: !current.is_pinned })
      .eq('id', questionId)
      .eq('class_id', classId)
      .select('*, profiles(id, full_name, avatar_url)')
      .single();

    if (error || !updatedRow) {
      throw ApiError.internal('Failed to update pin status');
    }

    return {
      id: updatedRow.id,
      classId: updatedRow.class_id,
      studentId: updatedRow.student_id,
      studentName: updatedRow.profiles?.full_name || 'Student',
      studentAvatar: updatedRow.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      questionText: updatedRow.question_text,
      likesCount: Number(updatedRow.likes_count) || 0,
      isPinned: Boolean(updatedRow.is_pinned),
      isAnswered: Boolean(updatedRow.is_answered),
      instructorReply: updatedRow.instructor_reply,
      instructorReplyAt: updatedRow.instructor_reply_at,
      createdAt: updatedRow.created_at,
      updatedAt: updatedRow.updated_at,
    };
  }

  /**
   * 14. Delete Question
   */
  public async deleteQuestion(userId: string, userRole: string, classId: string, questionId: string): Promise<{ success: boolean }> {
    const { data: q } = await supabaseAdmin
      .from('live_class_qa')
      .select('id, student_id, class_id')
      .eq('id', questionId)
      .eq('class_id', classId)
      .maybeSingle();

    if (!q) {
      throw ApiError.notFound('Question not found');
    }

    if (userRole !== 'admin') {
      if (userRole === 'instructor') {
        const { data: lc } = await supabaseAdmin
          .from('live_classes')
          .select('instructor_id')
          .eq('id', classId)
          .maybeSingle();

        if (!lc || lc.instructor_id !== userId) {
          throw ApiError.forbidden('You can only delete questions for your own live classes');
        }
      } else {
        if (q.student_id !== userId) {
          throw ApiError.forbidden('You can only delete your own questions');
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('live_class_qa')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw ApiError.internal('Failed to delete question');
    }

    return { success: true };
  }
}

export const liveClassService = new LiveClassService();

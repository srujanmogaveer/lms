import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  CreateSubmissionDto,
  GradeSubmissionDto,
  ReorderItem,
} from '../types';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';
import { courseService } from './course.service';

export class AssignmentService {
  // In-memory fallback cache for development/resilience
  private static inMemoryReattemptRequests: any[] = [];

  /**
   * Helper to count approved reattempts for a student on an assignment
   */
  public async getApprovedReattemptsCount(assignmentId: string, studentId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .eq('status', 'Approved');

      if (!error && count !== null) {
        return count;
      }
    } catch {
      // Ignore DB error, fall back to in-memory store
    }

    return AssignmentService.inMemoryReattemptRequests.filter(
      (r) => r.assignment_id === assignmentId && r.student_id === studentId && (r.status === 'Approved' || r.status === 'approved')
    ).length;
  }

  /**
   * Helper to parse attachment metadata from instructions/description or DB columns
   */
  public static parseAttachmentMeta(row: any): {
    cleanInstructions: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: string;
    attachmentType?: string;
  } {
    let cleanInstructions = row.instructions || '';
    let attachmentUrl = row.attachment_url || undefined;
    let attachmentName = row.attachment_name || undefined;
    let attachmentSize = row.attachment_size || undefined;
    let attachmentType = row.attachment_type || undefined;

    const match = cleanInstructions.match(/<!-- ATTACHMENT:(\{.*?\}) -->/);
    if (match && match[1]) {
      try {
        const meta = JSON.parse(match[1]);
        if (!attachmentUrl && meta.url) attachmentUrl = meta.url;
        if (!attachmentName && meta.name) attachmentName = meta.name;
        if (!attachmentSize && meta.size) attachmentSize = meta.size;
        if (!attachmentType && meta.type) attachmentType = meta.type;
        cleanInstructions = cleanInstructions.replace(/<!-- ATTACHMENT:(\{.*?\}) -->\n?/, '').trim();
      } catch {
        // ignore parse error
      }
    }

    return {
      cleanInstructions,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      attachmentType,
    };
  }

  public static packInstructionsWithAttachment(
    instructions: string,
    attachment?: { url?: string; name?: string; size?: string; type?: string }
  ): string {
    let cleaned = (instructions || '').replace(/<!-- ATTACHMENT:(\{.*?\}) -->\n?/, '').trim();
    if (attachment && attachment.url) {
      const metaStr = JSON.stringify({
        url: attachment.url,
        name: attachment.name || 'Attachment',
        size: attachment.size || '',
        type: attachment.type || '',
      });
      return `${cleaned}\n<!-- ATTACHMENT:${metaStr} -->`;
    }
    return cleaned;
  }

  /**
   * Helper to format DB assignment row
   */
  private formatAssignment(row: any, submissionsCount = 0, gradedCount = 0, pendingCount = 0): Assignment {
    const attMeta = AssignmentService.parseAttachmentMeta(row);

    return {
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.courses?.title || undefined,
      moduleId: row.module_id || undefined,
      moduleTitle: row.course_modules?.title || undefined,
      lessonId: row.lesson_id || undefined,
      lessonTitle: row.lessons?.title || undefined,
      title: row.title,
      description: row.description || '',
      instructions: attMeta.cleanInstructions,
      dueDays: Number(row.due_days) || 0,
      maxScore: Number(row.max_score) || 100,
      passingScore: Number(row.passing_score) || 60,
      maxAttempts: row.max_attempts !== undefined && row.max_attempts !== null ? Number(row.max_attempts) : 3,
      attachmentUrl: attMeta.attachmentUrl,
      attachmentName: attMeta.attachmentName,
      attachmentSize: attMeta.attachmentSize,
      attachmentType: attMeta.attachmentType,
      status: row.status || 'Published',
      position: Number(row.position) || 1,
      submissionsCount,
      gradedCount,
      pendingCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper to format DB submission row
   */
  private formatSubmission(row: any): AssignmentSubmission {
    const asg = row.assignments;
    const courseTitle = asg?.courses?.title || asg?.course_title || row.course_title || undefined;
    const courseId = asg?.course_id || row.course_id || undefined;
    const maxScore = asg?.max_score !== undefined && asg?.max_score !== null ? Number(asg.max_score) : undefined;
    const passingScore = asg?.passing_score !== undefined && asg?.passing_score !== null ? Number(asg.passing_score) : undefined;
    const dueDate = asg?.due_days !== undefined ? asg.due_days : undefined;

    return {
      id: row.id,
      assignmentId: row.assignment_id,
      assignmentTitle: asg?.title || row.assignment_title || undefined,
      courseId,
      courseTitle,
      maxScore,
      passingScore,
      dueDate,
      studentId: row.student_id,
      studentName: row.profiles?.full_name || 'Student',
      studentEmail: row.profiles?.email || undefined,
      studentAvatar: row.profiles?.avatar_url || '',
      submissionText: row.submission_text || '',
      fileUrl: row.file_url || '',
      attemptNumber: row.attempt_number !== undefined && row.attempt_number !== null ? Number(row.attempt_number) : 1,
      submittedAt: row.submitted_at || row.created_at,
      score: row.score !== null && row.score !== undefined ? Number(row.score) : undefined,
      feedback: row.feedback || '',
      status: row.status || 'Submitted',
      gradedAt: row.graded_at || undefined,
      gradedBy: row.graded_by || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper to verify instructor ownership of course
   */
  public async verifyCourseOwnership(
    instructorProfileId: string,
    courseId: string,
    mustBeMutable = false
  ): Promise<any> {
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id, course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !course) {
      throw ApiError.notFound('Course not found');
    }

    const { data: admin } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', instructorProfileId)
      .eq('role', 'admin')
      .maybeSingle();

    if (course.instructor_id !== instructorProfileId && !admin) {
      throw ApiError.forbidden('Forbidden: You can only manage assignments for your own courses');
    }

    if (
      mustBeMutable &&
      !admin &&
      (course.course_status === 'Published' || course.approval_status === 'Pending Approval')
    ) {
      throw ApiError.forbidden(
        course.approval_status === 'Pending Approval'
          ? 'Assignments and tasks are locked while under Admin Review.'
          : 'Assignment structure is locked for published courses to protect active student submissions and grades.'
      );
    }

    return course;
  }


  /**
   * 1. Get Course Assignments (Instructor View)
   */
  public async getInstructorCourseAssignments(instructorProfileId: string, courseId: string): Promise<Assignment[]> {
    await this.verifyCourseOwnership(instructorProfileId, courseId);

    const { data: rows, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses:course_id(title),
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching instructor assignments:', error);
      throw ApiError.internal('Failed to retrieve assignments');
    }

    if (!rows || rows.length === 0) {
      return [];
    }

    // Fetch submissions counts for each assignment
    const assignmentIds = rows.map((r) => r.id);
    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('assignment_id, status')
      .in('assignment_id', assignmentIds);

    const countsMap = new Map<string, { total: number; graded: number; pending: number }>();
    (submissions || []).forEach((s) => {
      const current = countsMap.get(s.assignment_id) || { total: 0, graded: 0, pending: 0 };
      current.total += 1;
      if (s.status === 'Graded') current.graded += 1;
      else current.pending += 1;
      countsMap.set(s.assignment_id, current);
    });

    return rows.map((row) => {
      const counts = countsMap.get(row.id) || { total: 0, graded: 0, pending: 0 };
      return this.formatAssignment(row, counts.total, counts.graded, counts.pending);
    });
  }

  /**
   * 1b. Get All Assignments Across All Courses Owned by the Instructor
   */
  public async getAllInstructorAssignments(instructorProfileId: string): Promise<Assignment[]> {
    // Fetch all course IDs owned by this instructor
    const { data: courses, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorProfileId);

    if (courseErr) {
      logger.error('Error fetching instructor courses for assignments list:', courseErr);
      throw ApiError.internal('Failed to retrieve instructor courses');
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    const courseIds = courses.map((c) => c.id);

    const { data: rows, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses:course_id(title),
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching all instructor assignments:', error);
      throw ApiError.internal('Failed to retrieve assignments');
    }

    if (!rows || rows.length === 0) {
      return [];
    }

    // Fetch submissions counts for each assignment
    const assignmentIds = rows.map((r) => r.id);
    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('assignment_id, status')
      .in('assignment_id', assignmentIds);

    const countsMap = new Map<string, { total: number; graded: number; pending: number }>();
    (submissions || []).forEach((s) => {
      const current = countsMap.get(s.assignment_id) || { total: 0, graded: 0, pending: 0 };
      current.total += 1;
      if (s.status === 'Graded') current.graded += 1;
      else current.pending += 1;
      countsMap.set(s.assignment_id, current);
    });

    return rows.map((row) => {
      const counts = countsMap.get(row.id) || { total: 0, graded: 0, pending: 0 };
      return this.formatAssignment(row, counts.total, counts.graded, counts.pending);
    });
  }

  /**
   * 2. Create Assignment (Instructor)
   */
  public async createAssignment(
    instructorProfileId: string,
    courseId: string,
    dto: CreateAssignmentDto
  ): Promise<Assignment> {
    await this.verifyCourseOwnership(instructorProfileId, courseId, true);

    // Validate module/lesson relationship if provided
    if (dto.moduleId) {
      const { data: mod } = await supabaseAdmin
        .from('course_modules')
        .select('id, course_id')
        .eq('id', dto.moduleId)
        .maybeSingle();

      if (!mod || mod.course_id !== courseId) {
        throw ApiError.badRequest('Selected module does not belong to this course');
      }
    }

    if (dto.lessonId) {
      const { data: les } = await supabaseAdmin
        .from('lessons')
        .select('id, module_id, course_modules(course_id)')
        .eq('id', dto.lessonId)
        .maybeSingle();

      if (!les || (les.course_modules as any)?.course_id !== courseId) {
        throw ApiError.badRequest('Selected lesson does not belong to this course');
      }
    }

    // Determine position
    let position = dto.position;
    if (!position) {
      const { data: lastItem } = await supabaseAdmin
        .from('assignments')
        .select('position')
        .eq('course_id', courseId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();
      position = (lastItem?.position || 0) + 1;
    }

    const packedInstructions = AssignmentService.packInstructionsWithAttachment(
      dto.instructions || '',
      dto.attachmentUrl
        ? {
            url: dto.attachmentUrl,
            name: dto.attachmentName,
            size: dto.attachmentSize,
            type: dto.attachmentType,
          }
        : undefined
    );

    const payload = {
      course_id: courseId,
      module_id: dto.moduleId || null,
      lesson_id: dto.lessonId || null,
      title: dto.title.trim(),
      description: dto.description || '',
      instructions: packedInstructions,
      due_days: dto.dueDays !== undefined ? dto.dueDays : 7,
      max_score: dto.maxScore || 100,
      passing_score: dto.passingScore !== undefined ? dto.passingScore : 60,
      max_attempts: dto.maxAttempts !== undefined && dto.maxAttempts !== null ? Math.max(1, dto.maxAttempts) : 3,
      status: dto.status || 'Published',
      position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabaseAdmin
      .from('assignments')
      .insert(payload)
      .select(`
        *,
        courses:course_id(title),
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .single();

    if (error || !inserted) {
      logger.error('Error creating assignment:', error);
      throw ApiError.badRequest(error?.message || 'Failed to create assignment');
    }

    // Update assignments_count on course
    const { count } = await supabaseAdmin
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    await supabaseAdmin
      .from('courses')
      .update({ assignments_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', courseId);

    return this.formatAssignment(inserted);
  }

  /**
   * 3. Get Assignment by ID (Instructor / Student)
   */
  public async getAssignmentById(assignmentId: string): Promise<Assignment> {
    const { data: row, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses:course_id(title),
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .eq('id', assignmentId)
      .maybeSingle();

    if (error || !row) {
      throw ApiError.notFound('Assignment not found');
    }

    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('status')
      .eq('assignment_id', assignmentId);

    let graded = 0;
    let pending = 0;
    (submissions || []).forEach((s) => {
      if (s.status === 'Graded') graded += 1;
      else pending += 1;
    });

    return this.formatAssignment(row, (submissions || []).length, graded, pending);
  }

  /**
   * 4. Update Assignment (Instructor)
   */
  public async updateAssignment(
    instructorProfileId: string,
    assignmentId: string,
    dto: UpdateAssignmentDto
  ): Promise<Assignment> {
    const existing = await this.getAssignmentById(assignmentId);
    await this.verifyCourseOwnership(instructorProfileId, existing.courseId, true);

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) payload.title = dto.title.trim();
    if (dto.description !== undefined) payload.description = dto.description;
    
    if (dto.instructions !== undefined || dto.attachmentUrl !== undefined || dto.attachmentName !== undefined) {
      const baseInstructions = dto.instructions !== undefined ? dto.instructions : existing.instructions;
      const targetUrl = dto.attachmentUrl !== undefined ? (dto.attachmentUrl || undefined) : existing.attachmentUrl;
      const targetName = dto.attachmentName !== undefined ? dto.attachmentName : existing.attachmentName;
      const targetSize = dto.attachmentSize !== undefined ? dto.attachmentSize : existing.attachmentSize;
      const targetType = dto.attachmentType !== undefined ? dto.attachmentType : existing.attachmentType;

      payload.instructions = AssignmentService.packInstructionsWithAttachment(
        baseInstructions || '',
        targetUrl
          ? {
              url: targetUrl,
              name: targetName,
              size: targetSize,
              type: targetType,
            }
          : undefined
      );
    }

    if (dto.moduleId !== undefined) payload.module_id = dto.moduleId || null;
    if (dto.lessonId !== undefined) payload.lesson_id = dto.lessonId || null;
    if (dto.dueDays !== undefined) payload.due_days = dto.dueDays;
    if (dto.maxScore !== undefined) payload.max_score = dto.maxScore;
    if (dto.passingScore !== undefined) payload.passing_score = dto.passingScore;
    if (dto.maxAttempts !== undefined && dto.maxAttempts !== null) payload.max_attempts = Math.max(1, dto.maxAttempts);
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.position !== undefined) payload.position = dto.position;

    const { data: updated, error } = await supabaseAdmin
      .from('assignments')
      .update(payload)
      .eq('id', assignmentId)
      .select(`
        *,
        courses:course_id(title),
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .single();

    if (error || !updated) {
      throw ApiError.badRequest(error?.message || 'Failed to update assignment');
    }

    return this.formatAssignment(updated, existing.submissionsCount, existing.gradedCount, existing.pendingCount);
  }

  /**
   * 5. Delete Assignment (Instructor)
   */
  public async deleteAssignment(instructorProfileId: string, assignmentId: string): Promise<void> {
    const existing = await this.getAssignmentById(assignmentId);
    await this.verifyCourseOwnership(instructorProfileId, existing.courseId, true);

    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', assignmentId);
    if (error) {
      throw ApiError.badRequest(error.message);
    }

    // Update assignments_count on course
    const { count } = await supabaseAdmin
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', existing.courseId);

    await supabaseAdmin
      .from('courses')
      .update({ assignments_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', existing.courseId);
  }

  /**
   * 6. Reorder Assignments
   */
  public async reorderAssignments(
    instructorProfileId: string,
    courseId: string,
    items: ReorderItem[]
  ): Promise<void> {
    await this.verifyCourseOwnership(instructorProfileId, courseId, true);


    const updatePromises = items.map((item) =>
      supabaseAdmin
        .from('assignments')
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('course_id', courseId)
    );

    await Promise.all(updatePromises);
  }

  /**
   * 7. Get Assignment Submissions (Instructor / Admin)
   */
  public async getAssignmentSubmissions(
    instructorProfileId: string,
    assignmentId: string
  ): Promise<AssignmentSubmission[]> {
    const assignment = await this.getAssignmentById(assignmentId);
    await this.verifyCourseOwnership(instructorProfileId, assignment.courseId);

    const { data: rows, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignments:assignment_id(title, course_id, max_score, passing_score, due_days, courses:course_id(title)),
        profiles:student_id(full_name, email, avatar_url)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      logger.error('Error fetching assignment submissions:', error);
      throw ApiError.internal('Failed to retrieve submissions');
    }

    return (rows || []).map((row) => this.formatSubmission(row));
  }

  /**
   * 7a. Get Single Submission Details by Submission ID (Instructor / Admin)
   */
  public async getSubmissionByIdForInstructor(
    instructorProfileId: string,
    submissionId: string
  ): Promise<AssignmentSubmission> {
    if (!submissionId) {
      throw ApiError.badRequest('Submission ID is required');
    }

    const { data: row, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignments:assignment_id(id, title, course_id, max_score, passing_score, due_days, courses:course_id(id, title, instructor_id)),
        profiles:student_id(id, full_name, email, avatar_url)
      `)
      .eq('id', submissionId)
      .maybeSingle();

    if (error) {
      logger.error('Error querying assignment submission by ID:', error);
      throw ApiError.internal(`Failed to retrieve submission: ${error.message}`);
    }

    if (!row) {
      throw ApiError.notFound('Submission not found');
    }

    const asg = row.assignments as any;
    const courseId = asg?.course_id || asg?.courses?.id;
    if (!courseId) {
      throw ApiError.notFound('Course associated with this assignment submission not found');
    }

    // Verify course ownership
    await this.verifyCourseOwnership(instructorProfileId, courseId);

    return this.formatSubmission(row);
  }

  /**
   * 7c. Get a signed URL for the submission file (for inline PDF preview)
   */
  public async getSubmissionSignedFileUrl(
    instructorProfileId: string,
    submissionId: string
  ): Promise<{ signedUrl: string; fileName: string; mimeType: string }> {
    // 1. Fetch the submission
    const { data: row, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select('id, file_url, assignments:assignment_id(course_id)')
      .eq('id', submissionId)
      .maybeSingle();

    if (error || !row) {
      throw ApiError.notFound('Submission not found');
    }

    const courseId = (row.assignments as any)?.course_id;
    if (!courseId) throw ApiError.notFound('Assignment course not found');

    // 2. Verify instructor owns the course
    await this.verifyCourseOwnership(instructorProfileId, courseId);

    const rawFileUrl: string = row.file_url || '';
    if (!rawFileUrl) {
      throw ApiError.badRequest('No file attached to this submission');
    }

    // 3. Normalize object path:
    // If it starts with 'assignments/' or 'assignment-submissions/', strip that leading segment if the bucket is assignment-submissions
    let cleanPath = rawFileUrl.trim();
    // Strip query parameters
    cleanPath = cleanPath.split('?')[0];

    // If stored as a full Supabase storage URL, extract object path
    if (cleanPath.includes('/storage/v1/object/')) {
      const match = cleanPath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
      if (match && match[1]) {
        cleanPath = decodeURIComponent(match[1]);
      }
    }

    // Determine candidate bucket and path variations
    const BUCKET = 'assignment-submissions';
    const possiblePaths: { bucket: string; path: string }[] = [];

    // Path variation 1: Direct cleanPath in assignment-submissions
    possiblePaths.push({ bucket: BUCKET, path: cleanPath });

    // Path variation 2: If starts with assignments/, strip 'assignments/'
    if (cleanPath.startsWith('assignments/')) {
      possiblePaths.push({ bucket: BUCKET, path: cleanPath.replace(/^assignments\//, '') });
    }

    // Path variation 3: If starts with assignment-submissions/, strip it
    if (cleanPath.startsWith('assignment-submissions/')) {
      possiblePaths.push({ bucket: BUCKET, path: cleanPath.replace(/^assignment-submissions\//, '') });
    }

    // Path variation 4: Also check lesson-documents or lesson-resources as fallbacks
    possiblePaths.push({ bucket: 'lesson-documents', path: cleanPath });
    possiblePaths.push({ bucket: 'lesson-resources', path: cleanPath });

    let finalSignedUrl: string | null = null;
    let finalPath = cleanPath;

    for (const item of possiblePaths) {
      const { data: signedData, error: signErr } = await supabaseAdmin.storage
        .from(item.bucket)
        .createSignedUrl(item.path, 3600); // 1-hour expiry

      if (!signErr && signedData?.signedUrl) {
        finalSignedUrl = signedData.signedUrl;
        finalPath = item.path;
        break;
      }
    }

    if (!finalSignedUrl) {
      logger.warn(`Storage object not found for submission ${submissionId}, path: ${rawFileUrl}`);
      throw ApiError.notFound('Submitted file was not found in Storage');
    }

    const fileName = finalPath.split('/').pop() || 'submission.pdf';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      zip: 'application/zip',
      txt: 'text/plain',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };

    return {
      signedUrl: finalSignedUrl,
      fileName,
      mimeType: mimeMap[ext] || 'application/octet-stream',
    };
  }

  /**
   * 7b. Get All Pending Submissions Across Instructor's Owned Courses
   */
  public async getInstructorPendingSubmissions(
    instructorProfileId: string,
    courseIdFilter?: string
  ): Promise<AssignmentSubmission[]> {
    // 1. Fetch instructor's course IDs (with courseIdFilter if provided)
    let courseQuery = supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('instructor_id', instructorProfileId);

    if (courseIdFilter && courseIdFilter !== 'All') {
      courseQuery = courseQuery.eq('id', courseIdFilter);
    }

    const { data: courses, error: courseErr } = await courseQuery;
    if (courseErr) {
      logger.error('Error fetching instructor courses for pending submissions:', courseErr);
      throw ApiError.internal('Failed to retrieve instructor courses');
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    const courseIds = courses.map((c) => c.id);

    // 2. Fetch all assignments for these courses
    const { data: assignments, error: asgErr } = await supabaseAdmin
      .from('assignments')
      .select('id, title, max_score, course_id, courses:course_id(title)')
      .in('course_id', courseIds);

    if (asgErr) {
      logger.error('Error fetching assignments for pending submissions:', asgErr);
      throw ApiError.internal('Failed to retrieve assignments');
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const assignmentIds = assignments.map((a) => a.id);

    // 3. Fetch submissions that are not yet graded (status != 'Graded' AND score IS NULL)
    const { data: rows, error: subErr } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignments:assignment_id(title, course_id, max_score, passing_score, due_days, courses:course_id(title)),
        profiles:student_id(full_name, email, avatar_url)
      `)
      .in('assignment_id', assignmentIds)
      .neq('status', 'Graded')
      .is('score', null)
      .order('submitted_at', { ascending: false });

    if (subErr) {
      logger.error('Error fetching pending submissions:', subErr);
      throw ApiError.internal('Failed to retrieve pending submissions');
    }

    return (rows || []).map((row) => this.formatSubmission(row));
  }

  /**
   * 8. Grade Student Submission (Instructor / Admin)
   */
  public async gradeSubmission(
    instructorProfileId: string,
    submissionId: string,
    dto: GradeSubmissionDto
  ): Promise<AssignmentSubmission> {
    const { data: submission, error: fetchErr } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*, assignments:assignment_id(course_id, max_score)')
      .eq('id', submissionId)
      .maybeSingle();

    if (fetchErr || !submission) {
      throw ApiError.notFound('Submission not found');
    }

    const courseId = (submission.assignments as any)?.course_id;
    const maxScore = Number((submission.assignments as any)?.max_score) || 100;

    await this.verifyCourseOwnership(instructorProfileId, courseId);

    if (dto.score < 0 || dto.score > maxScore) {
      throw ApiError.badRequest(`Score must be between 0 and maximum score (${maxScore})`);
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('assignment_submissions')
      .update({
        score: dto.score,
        feedback: dto.feedback || '',
        status: dto.status || 'Graded',
        graded_at: new Date().toISOString(),
        graded_by: instructorProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select(`
        *,
        assignments:assignment_id(title),
        profiles:student_id(full_name, avatar_url)
      `)
      .single();

    if (updateErr || !updated) {
      throw ApiError.badRequest(updateErr?.message || 'Failed to grade submission');
    }

    // Dispatch notification to the student (asynchronous & non-blocking)
    try {
      const assignmentTitle = (updated.assignments as any)?.title || 'Assignment';
      await NotificationService.createNotification({
        userId: submission.student_id,
        title: `Assignment Graded: ${assignmentTitle}`,
        message: `Your assignment was graded: ${dto.score}/${maxScore} marks.${dto.feedback ? ` Feedback: "${dto.feedback}"` : ''}`,
        type: 'success',
        category: 'assignment',
        actionUrl: '/student/assignments',
        sourceId: submissionId,
      });
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch assignment graded notification: ${notifErr.message}`);
    }

    return this.formatSubmission(updated);
  }

  /**
   * 9. Public / Student Course Assignments List
   */
  public async getPublicCourseAssignments(courseId: string): Promise<Assignment[]> {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (!course || course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.notFound('Course assignments not accessible');
    }

    const { data: rows, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses:course_id(title),
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .eq('course_id', courseId)
      .eq('status', 'Published')
      .order('position', { ascending: true });

    if (error) {
      throw ApiError.internal('Failed to retrieve course assignments');
    }

    return (rows || []).map((row) => this.formatAssignment(row));
  }

  /**
   * 10. Student Create Assignment Submission (With Strict Course Lesson Completion Validation)
   */
  public async submitStudentAssignment(
    studentId: string,
    assignmentId: string,
    dto: CreateSubmissionDto
  ): Promise<AssignmentSubmission> {
    const assignment = await this.getAssignmentById(assignmentId);

    if (assignment.status !== 'Published') {
      throw ApiError.badRequest('Cannot submit to an unpublished assignment');
    }

    const courseId = assignment.courseId;

    // 1. Verify Student Enrollment in the assignment's course
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollError || !enrollment) {
      throw ApiError.forbidden('You are not enrolled in the course for this assignment.');
    }

    if (enrollment.status === 'Cancelled') {
      throw ApiError.forbidden('Your enrollment in this course has been cancelled.');
    }

    // 2. Fetch all lesson IDs for this course
    const { data: modules, error: modError } = await supabaseAdmin
      .from('course_modules')
      .select('id, lessons(id)')
      .eq('course_id', courseId);

    if (modError) {
      throw ApiError.internal('Failed to verify course lesson requirement.');
    }

    const allLessonIds: string[] = [];
    (modules || []).forEach((m: any) => {
      const lessons = (m.lessons as any[]) || [];
      lessons.forEach((l) => allLessonIds.push(l.id));
    });

    const totalLessons = allLessonIds.length;

    // 3. Fetch completed lessons for this student in this course from public.lesson_progress
    let completedLessons = 0;
    if (totalLessons > 0) {
      const { data: progressRows, error: progError } = await supabaseAdmin
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('status', 'Completed');

      if (progError) {
        throw ApiError.internal('Failed to calculate student lesson progress.');
      }

      completedLessons = (progressRows || []).length;

      if (completedLessons < totalLessons) {
        throw new ApiError(
          403,
          `Complete all course lessons before submitting this assignment. (${completedLessons} of ${totalLessons} completed)`,
          {
            completedLessons,
            totalLessons,
            requiredLessonsPercentage: 100,
          }
        );
      }
    }

    // 4. Fetch all existing submission attempts for this student & assignment
    const { data: existingAttempts, error: attemptFetchErr } = await supabaseAdmin
      .from('assignment_submissions')
      .select('id, attempt_number, status, score, feedback, submitted_at, file_url')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });

    if (attemptFetchErr) {
      logger.error('Error fetching existing assignment submission attempts:', attemptFetchErr);
      throw ApiError.internal('Failed to verify submission attempts');
    }

    const attemptsList = existingAttempts || [];
    const maxAllowedAttempts = Number(assignment.maxAttempts) || 3;
    const passingScore = Number(assignment.passingScore) || 60;

    // Rule A: Check if ANY previous attempt already passed
    const alreadyPassed = attemptsList.some(
      (att) => att.status === 'Graded' && att.score !== null && Number(att.score) >= passingScore
    );
    if (alreadyPassed) {
      throw ApiError.badRequest('Assignment already passed. Resubmission is not required.');
    }

    // Rule B: Check if the latest attempt is still awaiting instructor grading
    const latestAttempt = attemptsList[0];
    if (latestAttempt && (latestAttempt.status === 'Submitted' || latestAttempt.status === 'Under Review' || latestAttempt.score === null)) {
      throw ApiError.badRequest('Cannot submit a new attempt while your previous attempt is awaiting instructor grading.');
    }

    // Rule C: Determine next attempt number and check against maximum attempts
    const approvedReattempts = await this.getApprovedReattemptsCount(assignmentId, studentId);
    const effectiveMaxAttempts = maxAllowedAttempts + (approvedReattempts || 0);
    const nextAttemptNumber = (latestAttempt?.attempt_number ? Number(latestAttempt.attempt_number) : 0) + 1;
    if (nextAttemptNumber > effectiveMaxAttempts) {
      throw ApiError.badRequest('Maximum submission attempts reached. You can request another attempt from your instructor.');
    }

    // 5. Insert new distinct attempt record
    const payload = {
      assignment_id: assignmentId,
      student_id: studentId,
      attempt_number: nextAttemptNumber,
      submission_text: dto.submissionText || '',
      file_url: dto.fileUrl || '',
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
      score: null,
      feedback: null,
      graded_at: null,
      graded_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('assignment_submissions')
      .insert(payload)
      .select(`
        *,
        assignments:assignment_id(title, course_id, max_score, passing_score, due_days),
        profiles:student_id(full_name, avatar_url)
      `)
      .single();

    if (insertErr || !inserted) {
      logger.error('Error inserting assignment submission attempt:', insertErr);
      throw ApiError.badRequest(insertErr?.message || 'Failed to submit assignment');
    }

    // Dispatch notification to course instructor (asynchronous & non-blocking)
    try {
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseRow?.instructor_id) {
        const studentName = (inserted.profiles as any)?.full_name || 'A student';
        const assignmentTitle = (inserted.assignments as any)?.title || assignment.title || 'Assignment';
        await NotificationService.createNotification({
          userId: courseRow.instructor_id,
          title: `New Assignment Submission: ${assignmentTitle}`,
          message: `${studentName} submitted an attempt for "${assignmentTitle}".`,
          type: 'info',
          category: 'assignment',
          actionUrl: '/instructor/assignments',
          sourceId: inserted.id,
        });
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch assignment submission notification: ${notifErr.message}`);
    }

    return this.formatSubmission(inserted);
  }

  /**
   * 11. Student Get Single Submission
   */
  public async getStudentSubmission(studentId: string, submissionId: string): Promise<AssignmentSubmission> {
    const { data: row, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignments:assignment_id(title),
        profiles:student_id(full_name, avatar_url)
      `)
      .eq('id', submissionId)
      .maybeSingle();

    if (error || !row) {
      throw ApiError.notFound('Submission not found');
    }

    if (row.student_id !== studentId) {
      throw ApiError.forbidden('Forbidden: You can only access your own submissions');
    }

    return this.formatSubmission(row);
  }

  /**
   * 12. Student Get Enrolled Assignments with Submissions & Lesson Lock Status
   */
  public async getStudentEnrolledAssignments(
    studentId: string,
    courseIdFilter?: string
  ): Promise<any[]> {
    // 1. Fetch student's active enrollments
    let enrollmentQuery = supabaseAdmin
      .from('enrollments')
      .select('course_id, courses(id, title, thumbnail, instructor_id, profiles:instructor_id(full_name, avatar_url), course_status, approval_status)')
      .eq('student_id', studentId);

    if (courseIdFilter) {
      enrollmentQuery = enrollmentQuery.eq('course_id', courseIdFilter);
    }

    const { data: enrollments, error: enrollError } = await enrollmentQuery;

    if (enrollError) {
      logger.error('Error fetching student enrollments for assignments:', enrollError);
      throw ApiError.internal('Failed to retrieve student enrolled assignments');
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    // Filter valid courses
    const validCourses = enrollments
      .map((e: any) => e.courses)
      .filter((c: any) => Boolean(c));

    if (validCourses.length === 0) {
      return [];
    }

    const courseIds = validCourses.map((c: any) => c.id);
    const courseMap = new Map<string, any>();
    validCourses.forEach((c: any) => courseMap.set(c.id, c));

    // 2. Compute real lesson completion per course for course isolation
    const { data: allModules } = await supabaseAdmin
      .from('course_modules')
      .select('id, course_id, lessons(id)')
      .in('course_id', courseIds);

    const courseTotalLessonsMap = new Map<string, number>();
    (allModules || []).forEach((m: any) => {
      const cId = m.course_id;
      const count = ((m.lessons as any[]) || []).length;
      courseTotalLessonsMap.set(cId, (courseTotalLessonsMap.get(cId) || 0) + count);
    });

    const { data: allCompletedProgress } = await supabaseAdmin
      .from('lesson_progress')
      .select('course_id, lesson_id')
      .eq('student_id', studentId)
      .in('course_id', courseIds)
      .eq('status', 'Completed');

    const courseCompletedLessonsMap = new Map<string, number>();
    (allCompletedProgress || []).forEach((p: any) => {
      courseCompletedLessonsMap.set(
        p.course_id,
        (courseCompletedLessonsMap.get(p.course_id) || 0) + 1
      );
    });

    // 3. Fetch published assignments for these enrolled courses
    const { data: assignments, error: asgError } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        course_modules:module_id(title),
        lessons:lesson_id(title)
      `)
      .in('course_id', courseIds)
      .eq('status', 'Published')
      .order('created_at', { ascending: false });

    if (asgError) {
      logger.error('Error fetching assignments for enrolled courses:', asgError);
      throw ApiError.internal('Failed to retrieve course assignments');
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const assignmentIds = assignments.map((a: any) => a.id);

    // 4. Fetch all student's submissions for these assignments (ordered by attempt_number ASC)
    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: true });

    // Group submissions by assignment_id
    const submissionsByAsgMap = new Map<string, any[]>();
    (submissions || []).forEach((sub: any) => {
      const list = submissionsByAsgMap.get(sub.assignment_id) || [];
      list.push(sub);
      submissionsByAsgMap.set(sub.assignment_id, list);
    });

    // Fetch student's assignment reattempt requests
    const reattemptRequests = await this.getStudentReattemptRequests(studentId);
    const reattemptByAsgMap = new Map<string, any[]>();
    (reattemptRequests || []).forEach((req) => {
      const asgKey = req.assignmentId || req.assignment_id;
      if (asgKey) {
        const list = reattemptByAsgMap.get(asgKey) || [];
        list.push(req);
        reattemptByAsgMap.set(asgKey, list);
      }
    });

    // 5. Assemble student assignment detail items with lock status & full attempt history
    return assignments.map((asg: any) => {
      const course = courseMap.get(asg.course_id);
      const asgSubmissions = submissionsByAsgMap.get(asg.id) || [];

      const totalLessons = courseTotalLessonsMap.get(asg.course_id) || 0;
      const completedLessons = courseCompletedLessonsMap.get(asg.course_id) || 0;
      const isLessonsCompleted = totalLessons === 0 || completedLessons >= totalLessons;

      const baseMaxAttempts = asg.max_attempts !== undefined && asg.max_attempts !== null ? Number(asg.max_attempts) : 3;
      const passingMarks = asg.passing_score !== undefined && asg.passing_score !== null ? Number(asg.passing_score) : 60;
      const totalPoints = asg.max_score !== undefined && asg.max_score !== null ? Number(asg.max_score) : 100;
      const attemptsUsed = asgSubmissions.length;

      // Determine if any attempt has passed
      const hasPassedAttempt = asgSubmissions.some(
        (sub) => sub.status === 'Graded' && sub.score !== null && Number(sub.score) >= passingMarks
      );

      // Reattempt requests for this assignment
      const asgReqs = reattemptByAsgMap.get(asg.id) || [];
      const approvedCount = asgReqs.filter((r) => (r.status || '').toLowerCase() === 'approved').length;
      const effectiveMaxAttempts = baseMaxAttempts + approvedCount;
      const latestRequest = asgReqs[0];

      let attemptRequestStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
      let attemptRequestFeedback: string | undefined = undefined;
      let attemptRequestId: string | undefined = undefined;

      if (latestRequest) {
        attemptRequestStatus = (latestRequest.status || 'none').toLowerCase() as any;
        attemptRequestFeedback = latestRequest.instructorFeedback || latestRequest.instructor_feedback || undefined;
        attemptRequestId = latestRequest.id;
      }

      // If approved, but student already used the extra attempt, status resets to 'none' if attemptsUsed >= effectiveMaxAttempts
      if (attemptRequestStatus === 'approved' && attemptsUsed >= effectiveMaxAttempts) {
        attemptRequestStatus = 'none';
      }

      // Latest attempt
      const latestSub = asgSubmissions[asgSubmissions.length - 1];

      let status: 'pending' | 'submitted' | 'under_review' | 'graded' = 'pending';
      let grade: number | undefined = undefined;

      if (latestSub) {
        if (latestSub.status === 'Graded') {
          status = 'graded';
          grade = latestSub.score !== null && latestSub.score !== undefined ? Number(latestSub.score) : undefined;
        } else if (latestSub.status === 'Submitted') {
          status = 'submitted';
        } else if (latestSub.status === 'Under Review') {
          status = 'under_review';
        }
      }

      // Can resubmit flag:
      // True only if:
      // 1. Not already passed
      // 2. Latest attempt is graded (not awaiting review)
      // 3. attemptsUsed < effectiveMaxAttempts
      const isLatestAwaitingGrading = latestSub && (latestSub.status === 'Submitted' || latestSub.status === 'Under Review' || latestSub.score === null);
      const canResubmit = !hasPassedAttempt && !isLatestAwaitingGrading && attemptsUsed < effectiveMaxAttempts;

      const attMeta = AssignmentService.parseAttachmentMeta(asg);
      const instructionsList: string[] = attMeta.cleanInstructions
        ? attMeta.cleanInstructions
            .split('\n')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        : [];

      // Map full submission history with attempt numbers
      const submissionHistory = asgSubmissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: asg.id,
        attemptNumber: sub.attempt_number !== undefined && sub.attempt_number !== null ? Number(sub.attempt_number) : 1,
        submittedAt: new Date(sub.submitted_at || sub.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        fileName: sub.file_url ? sub.file_url.split('/').pop() || 'submission_file.pdf' : 'online_text_submission',
        fileSize: 'Uploaded Solution',
        fileUrl: sub.file_url || undefined,
        status: (sub.status?.toLowerCase() === 'graded' ? 'graded' : 'submitted') as 'submitted' | 'graded',
        grade: sub.score !== null && sub.score !== undefined ? Number(sub.score) : undefined,
        feedback: sub.feedback
          ? {
              instructorName: course?.profiles?.full_name || 'Course Instructor',
              instructorAvatar: course?.profiles?.avatar_url || '',
              gradedAt: sub.graded_at ? new Date(sub.graded_at).toLocaleDateString('en-IN') : '',
              comment: sub.feedback,
              marksObtained: Number(sub.score) || 0,
              maxMarks: totalPoints,
            }
          : undefined,
      }));

      return {
        id: asg.id,
        courseId: asg.course_id,
        courseTitle: course?.title || 'Enrolled Course',
        title: asg.title,
        description: asg.description || 'Comprehensive course assignment assessing module competencies.',
        totalPoints,
        passingMarks,
        status,
        grade,
        attachmentUrl: attMeta.attachmentUrl,
        attachmentName: attMeta.attachmentName,
        attachmentSize: attMeta.attachmentSize,
        attachmentType: attMeta.attachmentType,
        isLocked: !isLessonsCompleted && asgSubmissions.length === 0,
        lockReason: !isLessonsCompleted && asgSubmissions.length === 0 ? 'Complete all course lessons before submitting this assignment.' : undefined,
        unlockRequirement: `Complete all course lessons (${completedLessons}/${totalLessons} completed)`,
        completedLessons,
        totalLessons,
        instructorName: course?.profiles?.full_name || 'Lead Instructor',
        instructorAvatar: course?.profiles?.avatar_url || '',
        category: 'Coursework',
        instructions: instructionsList.length > 0 ? instructionsList : [
          'Review the provided problem specification carefully before submitting.',
          'Format and upload all solution documents in PDF or ZIP archives.',
          'Ensure your code or analysis adheres strictly to grading guidelines.',
        ],
        allowedFileTypes: ['.pdf', '.zip', '.docx', '.txt'],
        maxFileSize: '25 MB',
        maxAttempts: effectiveMaxAttempts,
        baseMaxAttempts,
        attemptsUsed,
        attemptRequestStatus,
        attemptRequestFeedback,
        attemptRequestId,
        latestAttempt: latestSub ? this.formatSubmission(latestSub) : null,
        canResubmit,
        assignmentPassed: hasPassedAttempt,
        isLateSubmissionAllowed: true,
        submissionHistory,
        createdAt: asg.created_at,
      };
    });
  }

  /**
   * 13. Student: Get Signed URL for their own submission file
   */
  public async getStudentSubmissionSignedFileUrl(
    studentId: string,
    submissionId: string
  ): Promise<{ signedUrl: string; fileName: string; mimeType: string }> {
    const { data: row, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select('id, file_url, student_id')
      .eq('id', submissionId)
      .maybeSingle();

    if (error || !row) {
      throw ApiError.notFound('Submission not found');
    }

    // Authorization: student can only access their own submission file
    if (row.student_id !== studentId) {
      throw ApiError.forbidden('Forbidden: You can only access your own submission files');
    }

    const rawFileUrl: string = row.file_url || '';
    if (!rawFileUrl) {
      throw ApiError.badRequest('No file attached to this submission');
    }

    // Normalize the storage object path (same logic as instructor signed URL)
    let cleanPath = rawFileUrl.trim();
    cleanPath = cleanPath.split('?')[0];

    if (cleanPath.includes('/storage/v1/object/')) {
      const match = cleanPath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
      if (match && match[1]) {
        cleanPath = decodeURIComponent(match[1]);
      }
    }

    const BUCKET = 'assignment-submissions';
    const possiblePaths: { bucket: string; path: string }[] = [
      { bucket: BUCKET, path: cleanPath },
    ];

    if (cleanPath.startsWith('assignments/')) {
      possiblePaths.push({ bucket: BUCKET, path: cleanPath.replace(/^assignments\//, '') });
    }
    if (cleanPath.startsWith('assignment-submissions/')) {
      possiblePaths.push({ bucket: BUCKET, path: cleanPath.replace(/^assignment-submissions\//, '') });
    }
    possiblePaths.push({ bucket: 'lesson-documents', path: cleanPath });
    possiblePaths.push({ bucket: 'lesson-resources', path: cleanPath });

    let finalSignedUrl: string | null = null;
    let finalPath = cleanPath;

    for (const item of possiblePaths) {
      const { data: signedData, error: signErr } = await supabaseAdmin.storage
        .from(item.bucket)
        .createSignedUrl(item.path, 3600); // 1-hour expiry

      if (!signErr && signedData?.signedUrl) {
        finalSignedUrl = signedData.signedUrl;
        finalPath = item.path;
        break;
      }
    }

    if (!finalSignedUrl) {
      logger.warn(`Storage object not found for student submission ${submissionId}, path: ${rawFileUrl}`);
      throw ApiError.notFound('Submitted file was not found in Storage. It may have been removed.');
    }

    const fileName = finalPath.split('/').pop() || 'submission.pdf';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      zip: 'application/zip',
      txt: 'text/plain',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };

    return {
      signedUrl: finalSignedUrl,
      fileName,
      mimeType: mimeMap[ext] || 'application/octet-stream',
    };
  }

  /**
   * 14. Student: Request Additional Assignment Attempt
   */
  public async createReattemptRequest(
    studentId: string,
    assignmentId: string,
    reason: string
  ): Promise<any> {
    const assignment = await this.getAssignmentById(assignmentId);
    if (assignment.status !== 'Published') {
      throw ApiError.badRequest('Cannot request attempt for an unpublished assignment');
    }

    // Verify student is enrolled in course
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', assignment.courseId)
      .maybeSingle();

    if (!enrollment || enrollment.status === 'Cancelled') {
      throw ApiError.forbidden('You are not actively enrolled in this course.');
    }

    // Fetch existing submissions
    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('id, attempt_number, status, score')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });

    const attemptsList = submissions || [];
    const passingScore = Number(assignment.passingScore) || 60;
    const baseMax = Number(assignment.maxAttempts) || 3;

    // Check if already passed
    const alreadyPassed = attemptsList.some(
      (att) => att.status === 'Graded' && att.score !== null && Number(att.score) >= passingScore
    );
    if (alreadyPassed) {
      throw ApiError.badRequest('Assignment already passed. Extra attempts are not required.');
    }

    // Check if latest attempt is still awaiting review
    const latestAttempt = attemptsList[0];
    if (latestAttempt && (latestAttempt.status === 'Submitted' || latestAttempt.status === 'Under Review' || latestAttempt.score === null)) {
      throw ApiError.badRequest('Your latest attempt is still awaiting grading.');
    }

    // Check if attempts are actually exhausted
    const approvedReattempts = await this.getApprovedReattemptsCount(assignmentId, studentId);
    const effectiveMax = baseMax + approvedReattempts;
    const completedCount = attemptsList.length;

    if (completedCount < effectiveMax) {
      throw ApiError.badRequest('You still have assignment attempts remaining.');
    }

    // Fetch existing requests
    let existingRequests: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .order('requested_at', { ascending: false });

      if (!error && data && data.length > 0) {
        existingRequests = data;
      }
    } catch {
      // Handled by in-memory fallback below
    }

    if (existingRequests.length === 0) {
      existingRequests = AssignmentService.inMemoryReattemptRequests.filter(
        (r) => (r.assignment_id === assignmentId || r.assignmentId === assignmentId) && (r.student_id === studentId || r.studentId === studentId)
      );
    }

    const latestReq = existingRequests[0];
    if (latestReq && (latestReq.status === 'Pending' || latestReq.status === 'pending')) {
      throw ApiError.badRequest('An additional attempt request is already pending.');
    }

    if (latestReq && (latestReq.status === 'Rejected' || latestReq.status === 'rejected')) {
      throw ApiError.badRequest('Your request for an additional attempt was rejected by the instructor. You cannot submit another request.');
    }

    const newRequestId = crypto.randomUUID();
    const cleanReason = (reason || 'Requesting additional attempt after exhausting configured attempts.').trim();
    const nowStr = new Date().toISOString();

    const requestPayload = {
      id: newRequestId,
      assignment_id: assignmentId,
      student_id: studentId,
      reason: cleanReason,
      status: 'Pending',
      requested_at: nowStr,
      created_at: nowStr,
      updated_at: nowStr,
    };

    // Fetch course & instructor info
    const { data: courseRow } = await supabaseAdmin
      .from('courses')
      .select('instructor_id, title')
      .eq('id', assignment.courseId)
      .maybeSingle();

    const courseInstructorId = courseRow?.instructor_id;

    let createdRecord: any = null;

    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .insert(requestPayload)
        .select(`
          *,
          assignments:assignment_id(id, title, course_id, max_attempts, courses:course_id(id, title, instructor_id)),
          profiles:student_id(id, full_name, email, avatar_url)
        `)
        .single();

      if (!insertErr && inserted) {
        createdRecord = inserted;
      }
    } catch {
      // In-memory fallback
    }

    if (!createdRecord) {
      // Fetch student profile info for memory object
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', studentId)
        .maybeSingle();

      createdRecord = {
        ...requestPayload,
        course_id: assignment.courseId,
        instructor_id: courseInstructorId,
        assignmentTitle: assignment.title,
        courseTitle: courseRow?.title || assignment.courseTitle || 'Course',
        studentName: profile?.full_name || 'Student',
        studentEmail: profile?.email || '',
        studentAvatar: profile?.avatar_url || '',
        assignments: {
          id: assignment.id,
          title: assignment.title,
          course_id: assignment.courseId,
          max_attempts: assignment.maxAttempts,
          courses: {
            id: assignment.courseId,
            title: courseRow?.title || assignment.courseTitle || 'Course',
            instructor_id: courseInstructorId,
          },
        },
        profiles: profile || { id: studentId, full_name: 'Student', email: '', avatar_url: '' },
      };
      AssignmentService.inMemoryReattemptRequests.unshift(createdRecord);
    }

    // Dispatch notification to course instructor (asynchronous & non-blocking)
    try {
      if (courseInstructorId) {
        const studentName = createdRecord.profiles?.full_name || createdRecord.studentName || 'A student';
        const assignmentTitle = createdRecord.assignments?.title || assignment.title || 'Assignment';
        await NotificationService.createNotification({
          userId: courseInstructorId,
          title: `Assignment Reattempt Request: ${assignmentTitle}`,
          message: `${studentName} requested an additional attempt for "${assignmentTitle}". Reason: "${cleanReason}"`,
          type: 'info',
          category: 'assignment',
          actionUrl: '/instructor/assignments?tab=requests',
          sourceId: createdRecord.id,
        });
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch assignment reattempt notification: ${notifErr.message}`);
    }

    return createdRecord;
  }

  /**
   * 15. Student: Get All Reattempt Requests
   */
  public async getStudentReattemptRequests(studentId: string): Promise<any[]> {
    let rows: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .select('*, assignments:assignment_id(id, title, course_id, courses:course_id(title))')
        .eq('student_id', studentId)
        .order('requested_at', { ascending: false });

      if (!error && data && data.length > 0) {
        rows = data;
      }
    } catch {
      // Fallback
    }

    if (rows.length === 0) {
      rows = AssignmentService.inMemoryReattemptRequests.filter(
        (r) => r.student_id === studentId || r.studentId === studentId
      );
    }

    return rows.map((r) => ({
      id: r.id,
      assignmentId: r.assignment_id || r.assignments?.id || r.assignmentId,
      assignmentTitle: r.assignments?.title || r.assignmentTitle || 'Assignment',
      studentId: r.student_id || r.studentId,
      courseId: r.assignments?.course_id || r.courseId,
      courseTitle: r.assignments?.courses?.title || r.courseTitle || 'Course',
      reason: r.reason,
      status: (r.status || 'Pending').toLowerCase(),
      rawStatus: r.status || 'Pending',
      instructorFeedback: r.instructor_feedback || r.instructorFeedback,
      requestedAt: r.requested_at || r.requestedAt,
      reviewedAt: r.reviewed_at || r.reviewedAt,
      reviewedBy: r.reviewed_by || r.reviewedBy,
    }));
  }

  /**
   * 16. Instructor: Get Assignment Reattempt Requests
   */
  public async getInstructorReattemptRequests(authUserId: string, courseId?: string): Promise<any[]> {
    let rows: any[] = [];

    try {
      const { data, error } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .select(`
          *,
          assignments:assignment_id(id, title, course_id, max_attempts, courses:course_id(id, title, instructor_id)),
          profiles:student_id(id, full_name, avatar_url, email)
        `)
        .order('requested_at', { ascending: false });

      if (!error && data && data.length > 0) {
        rows = data;
      }
    } catch {
      // Fallback
    }

    if (rows.length === 0) {
      rows = AssignmentService.inMemoryReattemptRequests;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUserId)
      .single();

    const isAdmin = profile?.role === 'admin';

    const filtered = rows.filter((r: any) => {
      const instructorId = r.assignments?.courses?.instructor_id || r.instructor_id;
      const isInstructorCourse = isAdmin || instructorId === authUserId;
      const cId = r.assignments?.course_id || r.course_id;
      const matchesCourse = !courseId || cId === courseId;
      return isInstructorCourse && matchesCourse;
    });

    return Promise.all(
      filtered.map(async (r: any) => {
        const asgId = r.assignment_id || r.assignments?.id || r.assignmentId;
        const sId = r.student_id || r.studentId;

        const { count: completedCount } = await supabaseAdmin
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', asgId)
          .eq('student_id', sId);

        return {
          id: r.id,
          assignmentId: asgId,
          assignmentTitle: r.assignments?.title || r.assignmentTitle || 'Assignment',
          studentId: sId,
          studentName: r.profiles?.full_name || r.studentName || 'Student',
          studentEmail: r.profiles?.email || r.studentEmail || '',
          studentAvatar: r.profiles?.avatar_url || r.studentAvatar || '',
          courseId: r.assignments?.course_id || r.course_id,
          courseTitle: r.assignments?.courses?.title || r.courseTitle || 'Course',
          reason: r.reason,
          status: (r.status || 'Pending').toLowerCase(),
          rawStatus: r.status || 'Pending',
          instructorFeedback: r.instructor_feedback || r.instructorFeedback,
          attemptsUsed: completedCount || 0,
          maxAttempts: Number(r.assignments?.max_attempts) || 3,
          requestedAt: r.requested_at || r.requestedAt,
          reviewedAt: r.reviewed_at || r.reviewedAt,
          reviewedBy: r.reviewed_by || r.reviewedBy,
          requestDate: new Date(r.requested_at || r.created_at || Date.now()).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        };
      })
    );
  }

  /**
   * 17. Instructor: Approve Reattempt Request
   */
  public async approveReattemptRequest(authUserId: string, requestId: string): Promise<any> {
    return this.reviewReattemptRequest(authUserId, requestId, 'Approved');
  }

  /**
   * 18. Instructor: Reject Reattempt Request
   */
  public async rejectReattemptRequest(authUserId: string, requestId: string, feedback?: string): Promise<any> {
    return this.reviewReattemptRequest(authUserId, requestId, 'Rejected', feedback);
  }

  /**
   * 19. Instructor: Review Reattempt Request
   */
  public async reviewReattemptRequest(
    authUserId: string,
    requestId: string,
    status: 'Approved' | 'Rejected',
    feedback?: string
  ): Promise<any> {
    let reqItem: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .select('*, assignments:assignment_id(title, course_id, courses:course_id(instructor_id)), profiles:student_id(full_name)')
        .eq('id', requestId)
        .maybeSingle();

      if (!error && data) reqItem = data;
    } catch {
      // Fallback
    }

    if (!reqItem) {
      reqItem = AssignmentService.inMemoryReattemptRequests.find((r) => r.id === requestId);
    }

    if (!reqItem) {
      throw ApiError.notFound('Reattempt request not found');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authUserId)
      .single();

    const courseId = reqItem.assignments?.course_id || reqItem.course_id;
    if (profile?.role !== 'admin' && courseId) {
      await courseService.verifyCourseOwnership(authUserId, courseId);
    }

    const nowIso = new Date().toISOString();
    let updated: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('assignment_reattempt_requests')
        .update({
          status,
          reviewed_by: authUserId,
          instructor_feedback: feedback || null,
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', requestId)
        .select('*, assignments:assignment_id(title), profiles:student_id(full_name)')
        .single();

      if (!error && data) {
        updated = data;
      }
    } catch {
      // Fallback
    }

    if (!updated) {
      reqItem.status = status;
      reqItem.reviewed_by = authUserId;
      reqItem.instructor_feedback = feedback || null;
      reqItem.reviewed_at = nowIso;
      reqItem.updated_at = nowIso;
      updated = reqItem;
    }

    // Dispatch notification to requesting student (asynchronous & non-blocking)
    try {
      const assignmentTitle = updated.assignments?.title || reqItem.assignmentTitle || 'Assignment';
      await NotificationService.createNotification({
        userId: updated.student_id || updated.studentId,
        title: `Assignment Reattempt ${status === 'Approved' ? 'Approved' : 'Rejected'}`,
        message: `Your request for an additional attempt on "${assignmentTitle}" was ${status.toLowerCase()}.${feedback ? ` Feedback: "${feedback}"` : ''}`,
        type: status === 'Approved' ? 'success' : 'warning',
        category: 'assignment',
        actionUrl: '/student/assignments',
        sourceId: requestId,
      });
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch assignment reattempt reviewed notification: ${notifErr.message}`);
    }

    return updated;
  }
}

export const assignmentService = new AssignmentService();


import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  CourseModule,
  Lesson,
  CourseCurriculum,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderItem,
  LessonType,
} from '../types';
import { logger } from '../utils/logger';
import { StorageService, LESSON_RESOURCES_BUCKET, LESSON_DOCUMENTS_BUCKET } from './storage.service';

export class CurriculumService {
  /**
   * Helper to format DB module row and its nested lessons
   */
  private formatModule(row: any, lessons: Lesson[] = []): CourseModule {
    return {
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      description: row.description || undefined,
      position: Number(row.position) || 0,
      lessons,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper to format DB lesson row
   */
  private formatLesson(row: any): Lesson {
    return {
      id: row.id,
      moduleId: row.module_id,
      courseId: row.course_modules?.course_id || undefined,
      title: row.title,
      shortDescription: row.short_description || undefined,
      lessonType: (row.lesson_type || 'Video') as LessonType,
      content: row.content || undefined,
      videoUrl: row.video_url || undefined,
      documentUrl: row.document_url || undefined,
      resourceUrl: row.resource_url || undefined,
      durationMinutes: Number(row.duration_minutes) || 0,
      position: Number(row.position) || 0,
      isPreview: Boolean(row.is_preview),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Resolve verified instructor profile ID for the current authenticated user
   */
  public async resolveInstructorProfileId(authUserId: string): Promise<string> {
    console.log(`[CurriculumService] Authenticated user ID: ${authUserId}`);

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, status, instructor_approval_status')
      .eq('id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('[CurriculumService] Database error resolving instructor profile:', error);
    }

    if (!profile) {
      console.warn(`[CurriculumService] Instructor profile not found for user ID: ${authUserId}`);
      throw ApiError.unauthorized('Instructor profile not found');
    }

    console.log(`[CurriculumService] Profile ID: ${profile.id}, Profile role: ${profile.role}`);

    if (profile.role === 'admin') {
      return profile.id;
    }

    if (profile.role !== 'instructor') {
      throw ApiError.forbidden('Only instructors can manage curriculum');
    }

    if (profile.instructor_approval_status !== 'approved' || profile.status === 'pending_approval') {
      throw ApiError.forbidden('Your instructor application is still under review.');
    }

    return profile.id;
  }

  /**
   * Check if user is an admin
   */
  private async isUserAdmin(profileId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', profileId)
      .maybeSingle();
    return data?.role === 'admin';
  }

  /**
   * Verify that the instructor owns the course
   */
  public async verifyCourseOwnership(
    instructorProfileId: string,
    courseId: string,
    mustBeMutable = false
  ): Promise<any> {
    console.log(`[CurriculumService] Course ID: ${courseId}, Profile ID: ${instructorProfileId}`);

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, instructor_id, title, course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !course) {
      console.warn(`[CurriculumService] Course not found: courseId=${courseId}`);
      throw ApiError.notFound('Course not found');
    }

    console.log(`[CurriculumService] Course ID: ${course.id}, Course instructor ID: ${course.instructor_id}`);

    const isAdmin = await this.isUserAdmin(instructorProfileId);
    if (!isAdmin && course.instructor_id !== instructorProfileId) {
      console.warn(`[CurriculumService] Ownership mismatch: course.instructor_id (${course.instructor_id}) !== instructorProfileId (${instructorProfileId})`);
      throw ApiError.forbidden('You do not have permission to modify this course');
    }

    if (
      mustBeMutable &&
      !isAdmin &&
      (course.course_status === 'Published' || course.approval_status === 'Pending Approval')
    ) {
      throw ApiError.forbidden(
        course.approval_status === 'Pending Approval'
          ? 'Course curriculum and content are locked while under Admin Review.'
          : 'Curriculum structure is locked for published courses to protect active student learning progress and certificates.'
      );
    }

    return course;
  }

  /**
   * Verify that the instructor owns the module
   */
  public async verifyModuleOwnership(
    instructorProfileId: string,
    moduleId: string,
    mustBeMutable = false
  ): Promise<{ module: any; courseId: string }> {
    const { data: moduleRow, error } = await supabaseAdmin
      .from('course_modules')
      .select('id, course_id, title, position, courses!inner(id, instructor_id, title, course_status, approval_status)')
      .eq('id', moduleId)
      .maybeSingle();

    if (error || !moduleRow) {
      throw ApiError.notFound('Module not found');
    }

    const isAdmin = await this.isUserAdmin(instructorProfileId);
    const course = moduleRow.courses as any;
    if (!isAdmin && course.instructor_id !== instructorProfileId) {
      throw ApiError.forbidden('You do not have permission to modify this course');
    }

    if (
      mustBeMutable &&
      !isAdmin &&
      (course.course_status === 'Published' || course.approval_status === 'Pending Approval')
    ) {
      throw ApiError.forbidden(
        course.approval_status === 'Pending Approval'
          ? 'Course curriculum and content are locked while under Admin Review.'
          : 'Curriculum structure is locked for published courses to protect active student learning progress and certificates.'
      );
    }

    return { module: moduleRow, courseId: moduleRow.course_id };
  }

  /**
   * Verify that the instructor owns the lesson
   */
  public async verifyLessonOwnership(
    instructorProfileId: string,
    lessonId: string,
    mustBeMutable = false
  ): Promise<{ lesson: any; moduleId: string; courseId: string }> {
    const { data: lessonRow, error } = await supabaseAdmin
      .from('lessons')
      .select('*, course_modules!inner(id, course_id, courses!inner(id, instructor_id, course_status, approval_status))')
      .eq('id', lessonId)
      .maybeSingle();

    if (error || !lessonRow) {
      throw ApiError.notFound('Lesson not found');
    }

    const isAdmin = await this.isUserAdmin(instructorProfileId);
    const course = (lessonRow.course_modules as any).courses as any;
    if (!isAdmin && course.instructor_id !== instructorProfileId) {
      throw ApiError.forbidden('You do not have permission to modify this course');
    }

    if (
      mustBeMutable &&
      !isAdmin &&
      (course.course_status === 'Published' || course.approval_status === 'Pending Approval')
    ) {
      throw ApiError.forbidden(
        course.approval_status === 'Pending Approval'
          ? 'Course curriculum and content are locked while under Admin Review.'
          : 'Curriculum structure is locked for published courses to protect active student learning progress and certificates.'
      );
    }

    return {
      lesson: lessonRow,
      moduleId: lessonRow.module_id,
      courseId: lessonRow.course_modules.course_id,
    };
  }


  /**
   * Recalculate courses.lessons_count and courses.duration_hours
   */
  public async recalculateCourseMetrics(courseId: string): Promise<void> {
    try {
      const { data: lessons, error } = await supabaseAdmin
        .from('lessons')
        .select('duration_minutes, course_modules!inner(course_id)')
        .eq('course_modules.course_id', courseId);

      if (error) {
        logger.error('Error fetching lessons for recalculation:', error);
        return;
      }

      const totalLessons = lessons ? lessons.length : 0;
      const totalMinutes = lessons
        ? lessons.reduce((sum, l) => sum + (Number(l.duration_minutes) || 0), 0)
        : 0;
      const durationHours = Number((totalMinutes / 60.0).toFixed(2));

      await supabaseAdmin
        .from('courses')
        .update({
          lessons_count: totalLessons,
          duration_hours: durationHours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId);
    } catch (err) {
      logger.error('Failed to recalculate course metrics:', err);
    }
  }

  // ==========================================================================
  // MODULE OPERATIONS
  // ==========================================================================

  /**
   * Get all modules and lessons for a course (Instructor/Admin)
   */
  public async getInstructorCourseModules(instructorProfileId: string, courseId: string): Promise<CourseModule[]> {
    await this.verifyCourseOwnership(instructorProfileId, courseId);

    // Fetch modules
    const { data: moduleRows, error: moduleError } = await supabaseAdmin
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (moduleError) {
      logger.error('Error fetching course modules:', moduleError);
      throw ApiError.internal('Failed to retrieve course modules');
    }

    if (!moduleRows || moduleRows.length === 0) {
      return [];
    }

    const moduleIds = moduleRows.map((m) => m.id);

    // Fetch lessons for these modules
    const { data: lessonRows, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (lessonError) {
      logger.error('Error fetching lessons for modules:', lessonError);
      throw ApiError.internal('Failed to retrieve lessons');
    }

    // Group lessons by module_id
    const lessonsByModule: Record<string, Lesson[]> = {};
    (lessonRows || []).forEach((l) => {
      if (!lessonsByModule[l.module_id]) {
        lessonsByModule[l.module_id] = [];
      }
      lessonsByModule[l.module_id].push(this.formatLesson(l));
    });

    return moduleRows.map((m) => this.formatModule(m, lessonsByModule[m.id] || []));
  }

  /**
   * Create a new course module
   */
  public async createModule(
    instructorProfileId: string,
    courseId: string,
    dto: CreateModuleDto
  ): Promise<CourseModule> {
    await this.verifyCourseOwnership(instructorProfileId, courseId, true);

    // Calculate contiguous position
    let position = dto.position;
    if (!position || position <= 0) {
      const { data: lastModule } = await supabaseAdmin
        .from('course_modules')
        .select('position')
        .eq('course_id', courseId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      position = (lastModule?.position || 0) + 1;
    }

    const { data: created, error } = await supabaseAdmin
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        position,
      })
      .select()
      .single();

    if (error || !created) {
      logger.error('Error creating course module:', error);
      throw ApiError.badRequest(`Failed to create module: ${error?.message || 'Unknown error'}`);
    }

    return this.formatModule(created, []);
  }

  /**
   * Update a course module
   */
  public async updateModule(
    instructorProfileId: string,
    moduleId: string,
    dto: UpdateModuleDto
  ): Promise<CourseModule> {
    await this.verifyModuleOwnership(instructorProfileId, moduleId, true);

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updatePayload.title = dto.title.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description?.trim() || null;
    if (dto.position !== undefined) updatePayload.position = dto.position;

    const { data: updated, error } = await supabaseAdmin
      .from('course_modules')
      .update(updatePayload)
      .eq('id', moduleId)
      .select()
      .single();

    if (error || !updated) {
      logger.error('Error updating course module:', error);
      throw ApiError.badRequest(`Failed to update module: ${error?.message || 'Unknown error'}`);
    }

    // Fetch existing lessons
    const { data: lessonRows } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position', { ascending: true });

    const lessons = (lessonRows || []).map((l) => this.formatLesson(l));
    return this.formatModule(updated, lessons);
  }

  /**
   * Delete a course module (Cascades lessons and reorders remaining modules)
   */
  public async deleteModule(instructorProfileId: string, moduleId: string): Promise<void> {
    const { courseId } = await this.verifyModuleOwnership(instructorProfileId, moduleId, true);

    // Delete module
    const { error: deleteError } = await supabaseAdmin
      .from('course_modules')
      .delete()
      .eq('id', moduleId);

    if (deleteError) {
      logger.error('Error deleting course module:', deleteError);
      throw ApiError.badRequest(`Failed to delete module: ${deleteError.message}`);
    }

    // Reorder remaining modules contiguously: 1, 2, 3...
    const { data: remainingModules } = await supabaseAdmin
      .from('course_modules')
      .select('id, position')
      .eq('course_id', courseId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (remainingModules && remainingModules.length > 0) {
      for (let i = 0; i < remainingModules.length; i++) {
        const expectedPos = i + 1;
        if (remainingModules[i].position !== expectedPos) {
          await supabaseAdmin
            .from('course_modules')
            .update({ position: expectedPos, updated_at: new Date().toISOString() })
            .eq('id', remainingModules[i].id);
        }
      }
    }

    // Recalculate metrics for course
    await this.recalculateCourseMetrics(courseId);
  }

  /**
   * Reorder modules within a course
   */
  public async reorderModules(
    instructorProfileId: string,
    courseId: string,
    items: ReorderItem[]
  ): Promise<CourseModule[]> {
    await this.verifyCourseOwnership(instructorProfileId, courseId, true);

    // Update each module's position
    for (const item of items) {
      await supabaseAdmin
        .from('course_modules')
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('course_id', courseId);
    }

    return this.getInstructorCourseModules(instructorProfileId, courseId);
  }

  // ==========================================================================
  // LESSON OPERATIONS
  // ==========================================================================

  /**
   * Get lessons for a module (Instructor/Admin)
   */
  public async getInstructorModuleLessons(instructorProfileId: string, moduleId: string): Promise<Lesson[]> {
    await this.verifyModuleOwnership(instructorProfileId, moduleId);

    const { data: lessonRows, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching module lessons:', error);
      throw ApiError.internal('Failed to retrieve lessons');
    }

    return (lessonRows || []).map((l) => this.formatLesson(l));
  }

  /**
   * Get single lesson by ID (Instructor/Admin)
   */
  public async getInstructorLessonById(instructorProfileId: string, lessonId: string): Promise<Lesson> {
    const { lesson } = await this.verifyLessonOwnership(instructorProfileId, lessonId);
    return this.formatLesson(lesson);
  }

  /**
   * Create a new lesson inside a module
   */
  public async createLesson(
    instructorProfileId: string,
    moduleId: string,
    dto: CreateLessonDto
  ): Promise<Lesson> {
    const { courseId } = await this.verifyModuleOwnership(instructorProfileId, moduleId, true);

    // Calculate contiguous position within this module
    let position = dto.position;
    if (!position || position <= 0) {
      const { data: lastLesson } = await supabaseAdmin
        .from('lessons')
        .select('position')
        .eq('module_id', moduleId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      position = (lastLesson?.position || 0) + 1;
    }

    // Strictly validate lesson type values
    const validTypes: LessonType[] = ['Video', 'PDF', 'Text', 'Resource'];
    if (!validTypes.includes(dto.lessonType)) {
      throw ApiError.badRequest(`Invalid lesson type "${dto.lessonType}". Must be one of: Video, PDF, Text, Resource`);
    }

    const { data: created, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        module_id: moduleId,
        title: dto.title.trim(),
        short_description: dto.shortDescription?.trim() || null,
        lesson_type: dto.lessonType,
        content: dto.content || null,
        video_url: dto.videoUrl?.trim() || null,
        document_url: dto.documentUrl?.trim() || null,
        resource_url: dto.resourceUrl?.trim() || null,
        duration_minutes: Number(dto.durationMinutes) || 0,
        position,
        is_preview: Boolean(dto.isPreview),
      })
      .select()
      .single();

    if (error || !created) {
      logger.error('Error creating lesson:', error);
      throw ApiError.badRequest(`Failed to create lesson: ${error?.message || 'Unknown error'}`);
    }

    // Recalculate metrics
    await this.recalculateCourseMetrics(courseId);

    return this.formatLesson(created);
  }

  /**
   * Update a lesson
   */
  public async updateLesson(
    instructorProfileId: string,
    lessonId: string,
    dto: UpdateLessonDto
  ): Promise<Lesson> {
    const { courseId } = await this.verifyLessonOwnership(instructorProfileId, lessonId, true);


    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updatePayload.title = dto.title.trim();
    if (dto.shortDescription !== undefined) updatePayload.short_description = dto.shortDescription?.trim() || null;
    if (dto.lessonType !== undefined) {
      const validTypes: LessonType[] = ['Video', 'PDF', 'Text', 'Resource'];
      if (!validTypes.includes(dto.lessonType)) {
        throw ApiError.badRequest(`Invalid lesson type "${dto.lessonType}"`);
      }
      updatePayload.lesson_type = dto.lessonType;
    }
    if (dto.content !== undefined) updatePayload.content = dto.content || null;
    if (dto.videoUrl !== undefined) updatePayload.video_url = dto.videoUrl?.trim() || null;
    if (dto.documentUrl !== undefined) updatePayload.document_url = dto.documentUrl?.trim() || null;
    if (dto.resourceUrl !== undefined) updatePayload.resource_url = dto.resourceUrl?.trim() || null;
    if (dto.durationMinutes !== undefined) updatePayload.duration_minutes = Math.max(0, Number(dto.durationMinutes) || 0);
    if (dto.position !== undefined) updatePayload.position = dto.position;
    if (dto.isPreview !== undefined) updatePayload.is_preview = Boolean(dto.isPreview);

    // If an asset was removed or replaced, clean up old storage asset
    const { lesson: existingLesson } = await this.verifyLessonOwnership(instructorProfileId, lessonId);
    if (dto.videoUrl !== undefined && existingLesson.video_url && existingLesson.video_url !== dto.videoUrl) {
      await StorageService.deleteStorageAsset(existingLesson.video_url, LESSON_RESOURCES_BUCKET);
    }
    if (dto.documentUrl !== undefined && existingLesson.document_url && existingLesson.document_url !== dto.documentUrl) {
      await StorageService.deleteStorageAsset(existingLesson.document_url, LESSON_DOCUMENTS_BUCKET);
    }
    if (dto.resourceUrl !== undefined && existingLesson.resource_url && existingLesson.resource_url !== dto.resourceUrl) {
      await StorageService.deleteStorageAsset(existingLesson.resource_url, LESSON_RESOURCES_BUCKET);
    }

    const { data: updated, error } = await supabaseAdmin
      .from('lessons')
      .update(updatePayload)
      .eq('id', lessonId)
      .select()
      .single();

    if (error || !updated) {
      logger.error('Error updating lesson:', error);
      throw ApiError.badRequest(`Failed to update lesson: ${error?.message || 'Unknown error'}`);
    }

    // Recalculate metrics
    await this.recalculateCourseMetrics(courseId);

    return this.formatLesson(updated);
  }

  /**
   * Delete a lesson
   */
  public async deleteLesson(instructorProfileId: string, lessonId: string): Promise<void> {
    const { moduleId, courseId, lesson } = await this.verifyLessonOwnership(instructorProfileId, lessonId, true);

    // Delete attached storage files if present
    if (lesson.video_url) {
      await StorageService.deleteStorageAsset(lesson.video_url, LESSON_RESOURCES_BUCKET);
    }
    if (lesson.document_url) {
      await StorageService.deleteStorageAsset(lesson.document_url, LESSON_DOCUMENTS_BUCKET);
    }
    if (lesson.resource_url) {
      await StorageService.deleteStorageAsset(lesson.resource_url, LESSON_RESOURCES_BUCKET);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (deleteError) {
      logger.error('Error deleting lesson:', deleteError);
      throw ApiError.badRequest(`Failed to delete lesson: ${deleteError.message}`);
    }

    // Reorder remaining lessons in this module contiguously: 1, 2, 3...
    const { data: remainingLessons } = await supabaseAdmin
      .from('lessons')
      .select('id, position')
      .eq('module_id', moduleId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (remainingLessons && remainingLessons.length > 0) {
      for (let i = 0; i < remainingLessons.length; i++) {
        const expectedPos = i + 1;
        if (remainingLessons[i].position !== expectedPos) {
          await supabaseAdmin
            .from('lessons')
            .update({ position: expectedPos, updated_at: new Date().toISOString() })
            .eq('id', remainingLessons[i].id);
        }
      }
    }

    // Recalculate metrics
    await this.recalculateCourseMetrics(courseId);
  }

  /**
   * Reorder lessons within a module
   */
  public async reorderLessons(
    instructorProfileId: string,
    moduleId: string,
    items: ReorderItem[]
  ): Promise<Lesson[]> {
    await this.verifyModuleOwnership(instructorProfileId, moduleId, true);


    // Update each lesson's position
    for (const item of items) {
      await supabaseAdmin
        .from('lessons')
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('module_id', moduleId);
    }

    return this.getInstructorModuleLessons(instructorProfileId, moduleId);
  }

  // ==========================================================================
  // PUBLIC & STUDENT CURRICULUM ACCESS
  // ==========================================================================

  /**
   * Get full course curriculum for student/public viewer
   */
  public async getCourseCurriculum(courseIdOrSlug: string): Promise<CourseCurriculum> {
    // Resolve course by id or slug
    let query = supabaseAdmin
      .from('courses')
      .select('id, title, slug, thumbnail, difficulty, categories(name), course_status, approval_status');

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdOrSlug);
    if (isUuid) {
      query = query.eq('id', courseIdOrSlug);
    } else {
      query = query.eq('slug', courseIdOrSlug);
    }

    const { data: course, error: courseError } = await query.maybeSingle();

    if (courseError || !course) {
      throw ApiError.notFound('Course not found');
    }

    // If not approved and published, deny public access
    if (course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Curriculum is only accessible for published and approved courses');
    }

    // Fetch modules
    const { data: moduleRows, error: moduleError } = await supabaseAdmin
      .from('course_modules')
      .select('*')
      .eq('course_id', course.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (moduleError) {
      logger.error('Error fetching public course modules:', moduleError);
      throw ApiError.internal('Failed to retrieve course curriculum');
    }

    if (!moduleRows || moduleRows.length === 0) {
      return {
        courseId: course.id,
        courseTitle: course.title,
        category: (course.categories as any)?.name || 'General',
        difficulty: course.difficulty,
        thumbnail: course.thumbnail,
        modules: [],
      };
    }

    const moduleIds = moduleRows.map((m) => m.id);

    // Fetch lessons for these modules (scoped projection for syllabus outline)
    const { data: lessonRows, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, module_id, title, short_description, lesson_type, video_url, document_url, resource_url, duration_minutes, position, is_preview, created_at, updated_at')
      .in('module_id', moduleIds)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (lessonError) {
      logger.error('Error fetching public lessons:', lessonError);
      throw ApiError.internal('Failed to retrieve course lessons');
    }

    const lessonsByModule: Record<string, Lesson[]> = {};
    (lessonRows || []).forEach((l) => {
      if (!lessonsByModule[l.module_id]) {
        lessonsByModule[l.module_id] = [];
      }
      lessonsByModule[l.module_id].push(this.formatLesson(l));
    });

    const modules = moduleRows.map((m) => this.formatModule(m, lessonsByModule[m.id] || []));

    return {
      courseId: course.id,
      courseTitle: course.title,
      category: (course.categories as any)?.name || 'General',
      difficulty: course.difficulty,
      thumbnail: course.thumbnail,
      modules,
    };
  }

  /**
   * Get single module by ID for student/public viewer
   */
  public async getPublicModule(courseId: string, moduleId: string): Promise<CourseModule> {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (!course || course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Course is not available');
    }

    const { data: moduleRow, error } = await supabaseAdmin
      .from('course_modules')
      .select('*')
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error || !moduleRow) {
      throw ApiError.notFound('Module not found');
    }

    const { data: lessonRows } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('position', { ascending: true });

    const lessons = (lessonRows || []).map((l) => this.formatLesson(l));
    return this.formatModule(moduleRow, lessons);
  }

  /**
   * Get single lesson by ID for student/public viewer
   */
  public async getPublicLesson(lessonId: string): Promise<Lesson> {
    const { data: lessonRow, error } = await supabaseAdmin
      .from('lessons')
      .select('*, course_modules!inner(id, course_id, courses!inner(id, course_status, approval_status))')
      .eq('id', lessonId)
      .maybeSingle();

    if (error || !lessonRow) {
      throw ApiError.notFound('Lesson not found');
    }

    const course = (lessonRow.course_modules as any).courses as any;
    if (course.course_status !== 'Published' || course.approval_status !== 'Approved') {
      throw ApiError.forbidden('Lesson belongs to an unpublished course');
    }

    return this.formatLesson(lessonRow);
  }
}

export const curriculumService = new CurriculumService();

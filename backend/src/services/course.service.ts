import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  Course,
  CourseQueryFilters,
  CoursePriceType,
  CourseCompletionSummary,
} from '../types';
import { logger } from '../utils/logger';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { payoutService } from './payout.service';

// In-memory cache for category name to ID mapping (10 min TTL)
const categoryIdCache = new Map<string, { id: string; expiresAt: number }>();

export class CourseService {
  /**
   * Helper to format DB row and join instructor/category data
   */
  private formatCourse(row: any, instructorProfile?: any, categoryRow?: any): Course {
    const priceNum = Number(row.price) || 0;
    const discountNum = row.discount_price !== null && row.discount_price !== undefined ? Number(row.discount_price) : undefined;
    
    let priceType: CoursePriceType = row.price_type || 'Paid';
    if (priceNum === 0) {
      priceType = 'Free';
    } else if (discountNum !== undefined && discountNum > 0 && discountNum < priceNum) {
      priceType = 'Discounted';
    }

    return {
      id: row.id,
      instructorId: row.instructor_id,
      instructorName: instructorProfile?.full_name || row.profiles?.full_name || 'EduSphere Instructor',
      instructorAvatar: instructorProfile?.avatar_url || row.profiles?.avatar_url || undefined,
      categoryId: row.category_id,
      category: categoryRow?.name || row.categories?.name || 'General',
      subcategory: row.subcategory || undefined,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description || '',
      fullDescription: row.full_description || '',
      description: row.short_description || row.full_description || '',
      difficulty: row.difficulty || 'Beginner',
      level: row.difficulty || 'Beginner',
      language: row.language || 'English',
      thumbnail: row.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      promoVideoUrl: row.promo_video_url || '',
      price: priceNum,
      discountPrice: discountNum,
      priceType,
      courseStatus: row.course_status || 'Draft',
      approvalStatus: row.approval_status || 'Pending Approval',
      isPublished: row.course_status === 'Published' && row.approval_status === 'Approved',
      rejectionReason: row.rejection_reason || undefined,
      tags: Array.isArray(row.tags) ? row.tags : [],
      requirements: Array.isArray(row.requirements) ? row.requirements : [],
      learningOutcomes: Array.isArray(row.learning_outcomes) ? row.learning_outcomes : [],
      durationHours: Number(row.duration_hours) || 0,
      lessonsCount: Number(row.lessons_count) || 0,
      assignmentsCount: Number(row.assignments_count) || 0,
      quizzesCount: Number(row.quizzes_count) || 0,
      studentsEnrolled: Number(row.students_enrolled) || 0,
      rating: Number(row.rating) || 5.0,
      reviewsCount: Number(row.reviews_count) || 0,
      isFeatured: Boolean(row.is_featured),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Helper to resolve verified instructor profile ID for the current authenticated user
   */
  public async resolveInstructorProfileId(authUserId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status, instructor_approval_status')
      .eq('id', authUserId)
      .eq('role', 'instructor')
      .maybeSingle();

    if (error || !data) {
      // Check if admin is managing
      const { data: adminData } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', authUserId)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminData) return adminData.id;

      throw ApiError.unauthorized('Instructor profile not found for this account');
    }

    if (
      data.instructor_approval_status === 'rejected' ||
      data.status === 'suspended' ||
      (data.instructor_approval_status === 'pending' && data.status === 'pending_approval')
    ) {
      throw ApiError.forbidden('Your instructor application is still under review. You cannot manage courses until approved.');
    }

    return data.id;
  }

  /**
   * Helper to verify instructor ownership of a course
   */
  public async verifyCourseOwnership(authUserId: string, courseId: string): Promise<any> {
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, title, instructor_id, course_status, approval_status')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.instructor_id !== authUserId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', authUserId)
        .maybeSingle();

      if (!profile || profile.role !== 'admin') {
        throw ApiError.forbidden('Forbidden: You can only manage content for your own courses');
      }
    }

    return course;
  }

  /**
   * 1. Public & Student Course Catalog (Published + Approved only)
   */
  public async getPublicCourses(filters: CourseQueryFilters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('courses')
      .select(`
        id,
        instructor_id,
        category_id,
        subcategory,
        title,
        slug,
        short_description,
        difficulty,
        language,
        thumbnail,
        price,
        discount_price,
        price_type,
        course_status,
        approval_status,
        duration_hours,
        lessons_count,
        assignments_count,
        quizzes_count,
        students_enrolled,
        rating,
        reviews_count,
        is_featured,
        created_at,
        updated_at,
        profiles:instructor_id(full_name, avatar_url),
        categories:category_id(name)
      `, { count: 'exact' })
      .eq('course_status', 'Published')
      .eq('approval_status', 'Approved');

    // Search filter
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
    }

    // Category filter
    if (filters.category && filters.category !== 'All') {
      // Check if filter is category name or category UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.category);
      if (isUuid) {
        query = query.eq('category_id', filters.category);
      } else {
        // Find category ID from cache or DB
        const cacheKey = filters.category.toLowerCase().trim();
        const cached = categoryIdCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          query = query.eq('category_id', cached.id);
        } else {
          const { data: cat } = await supabaseAdmin.from('categories').select('id').ilike('name', filters.category).maybeSingle();
          if (cat) {
            categoryIdCache.set(cacheKey, { id: cat.id, expiresAt: Date.now() + 10 * 60 * 1000 });
            query = query.eq('category_id', cat.id);
          }
        }
      }
    }

    // Subcategory filter
    if (filters.subcategory && filters.subcategory !== 'All') {
      query = query.eq('subcategory', filters.subcategory);
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== 'All') {
      query = query.eq('difficulty', filters.difficulty);
    }

    // Language filter
    if (filters.language && filters.language !== 'All') {
      query = query.eq('language', filters.language);
    }

    // Price / Quick filter
    if (filters.priceType === 'free') {
      query = query.eq('price', 0);
    } else if (filters.priceType === 'paid') {
      query = query.gt('price', 0);
    } else if (filters.priceType === 'featured') {
      query = query.eq('is_featured', true);
    }

    // Min rating
    if (filters.minRating && filters.minRating > 0) {
      query = query.gte('rating', filters.minRating);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
        break;
      case 'students':
      case 'popular':
        query = query.order('students_enrolled', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rows, count, error } = await query;
    if (error) {
      logger.error('Error fetching public courses:', error);
      throw ApiError.internal('Failed to retrieve course catalog');
    }

    const courses = (rows || []).map((row) => this.formatCourse(row));

    return {
      courses,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    };
  }

  /**
   * 2. Get Public Course Details by ID or Slug
   */
  public async getCourseByIdOrSlug(idOrSlug: string): Promise<Course> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabaseAdmin
      .from('courses')
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)');

    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw ApiError.notFound('Course not found');
    }

    return this.formatCourse(data);
  }

  /**
   * 3. Get Instructor Courses (Only courses owned by the authenticated Instructor)
   */
  public async getInstructorCourses(instructorProfileId: string, filters: CourseQueryFilters) {
    let query = supabaseAdmin
      .from('courses')
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)', { count: 'exact' })
      .eq('instructor_id', instructorProfileId);

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
    }

    if (filters.courseStatus && filters.courseStatus !== 'All') {
      query = query.eq('course_status', filters.courseStatus);
    }

    if (filters.approvalStatus && filters.approvalStatus !== 'All') {
      query = query.eq('approval_status', filters.approvalStatus);
    }

    query = query.order('created_at', { ascending: false });

    const { data: rows, count, error } = await query;
    if (error) {
      logger.error('Error fetching instructor courses:', error);
      throw ApiError.internal('Failed to retrieve instructor courses');
    }

    const courses = (rows || []).map((row) => this.formatCourse(row));
    return { courses, total: count || 0 };
  }

  /**
   * 3b. Get Instructor Real Dashboard Stats
   */
  public async getInstructorDashboardStats(instructorProfileId: string) {
    // 1. Fetch instructor courses
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, title, course_status, approval_status, students_enrolled, rating, price, thumbnail, created_at')
      .eq('instructor_id', instructorProfileId);

    const courseList = courses || [];
    const totalCourses = courseList.length;
    const publishedCourses = courseList.filter(
      (c) => c.course_status === 'Published' && c.approval_status === 'Approved'
    ).length;
    const draftCourses = courseList.filter((c) => c.course_status === 'Draft').length;
    const courseIds = courseList.map((c) => c.id);

    // 2. Fetch enrollments for instructor courses
    let allEnrollments: any[] = [];
    if (courseIds.length > 0) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('id, student_id, course_id, enrolled_at, completion_percentage, status, profiles:student_id(full_name, avatar_url)')
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false });
      allEnrollments = enrollments || [];
    }

    const totalStudents = allEnrollments.length > 0 
      ? allEnrollments.length 
      : courseList.reduce((acc, curr) => acc + (curr.students_enrolled || 0), 0);

    // 3. Fetch pending assignment reviews
    let assignmentsPendingReview = 0;
    let recentSubmissions: any[] = [];
    if (courseIds.length > 0) {
      const { data: asgs } = await supabaseAdmin
        .from('assignments')
        .select('id, title, course_id, courses(title)')
        .in('course_id', courseIds);

      const asgList = asgs || [];
      const asgIds = asgList.map((a) => a.id);
      if (asgIds.length > 0) {
        const { count: pendingAsgCount } = await supabaseAdmin
          .from('assignment_submissions')
          .select('id', { count: 'exact', head: true })
          .in('assignment_id', asgIds)
          .eq('status', 'Submitted');

        assignmentsPendingReview = pendingAsgCount || 0;

        const { data: subs } = await supabaseAdmin
          .from('assignment_submissions')
          .select('id, assignment_id, student_id, status, submitted_at, profiles:student_id(full_name, avatar_url)')
          .in('assignment_id', asgIds)
          .order('submitted_at', { ascending: false })
          .limit(10);
        recentSubmissions = (subs || []).map((s: any) => {
          const asg = asgList.find((a) => a.id === s.assignment_id);
          return {
            ...s,
            assignmentTitle: asg?.title || 'Assignment',
            courseTitle: (asg?.courses as any)?.title || 'Course',
          };
        });
      }
    }

    // 4. Fetch pending quiz reviews / reattempt requests
    let quizzesPendingReview = 0;
    if (courseIds.length > 0) {
      try {
        const { data: qList } = await supabaseAdmin
          .from('quizzes')
          .select('id')
          .in('course_id', courseIds);

        const quizIds = (qList || []).map((q) => q.id);
        if (quizIds.length > 0) {
          const { count: pendingQuizCount } = await supabaseAdmin
            .from('quiz_reattempt_requests')
            .select('id', { count: 'exact', head: true })
            .in('quiz_id', quizIds)
            .eq('status', 'Pending');

          quizzesPendingReview = pendingQuizCount || 0;
        }
      } catch {
        quizzesPendingReview = 0;
      }
    }

    // 5. Query scheduled live classes count for this instructor
    let liveClassesScheduled = 0;
    try {
      const { count: liveCount } = await supabaseAdmin
        .from('live_classes')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorProfileId)
        .in('status', ['Scheduled', 'Live']);
      liveClassesScheduled = liveCount || 0;
    } catch {
      liveClassesScheduled = 0;
    }

    // 6. Fetch authoritative revenue and analytics directly from payoutService (Single Source of Truth)
    let totalRevenueINR = 0;
    let monthlyRevenueINR = 0;
    let revenueTrendPercent = 0;
    let monthlyTrendData: { month: string; enrollments: number; revenueINR: number }[] = [];
    const courseRevenueMap = new Map<string, number>();

    try {
      const analytics = await payoutService.getInstructorAnalytics(instructorProfileId);
      if (analytics?.overview) {
        totalRevenueINR = analytics.overview.totalRevenue || 0;
        monthlyRevenueINR = analytics.overview.monthlyRevenue || 0;
        revenueTrendPercent = analytics.overview.growthPercentage || 0;
      }
      if (Array.isArray(analytics?.monthlyTrends)) {
        monthlyTrendData = analytics.monthlyTrends.map((m) => ({
          month: m.month,
          enrollments: m.enrollments || 0,
          revenueINR: m.revenue || 0,
        }));
      }
      if (Array.isArray(analytics?.coursePerformance)) {
        for (const cp of analytics.coursePerformance) {
          courseRevenueMap.set(cp.id, cp.revenue || 0);
        }
      }
    } catch (analyticsErr) {
      logger.warn('Failed to fetch instructor analytics from payoutService in getInstructorDashboardStats:', analyticsErr);
    }

    // Student enrollment trend
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentMonthEnrollments = allEnrollments.filter(
      (e) => e.enrolled_at && new Date(e.enrolled_at) >= currentMonthStart
    );
    const lastMonthEnrollments = allEnrollments.filter(
      (e) => e.enrolled_at && new Date(e.enrolled_at) >= lastMonthStart && new Date(e.enrolled_at) <= lastMonthEnd
    );

    const studentsTrendPercent = lastMonthEnrollments.length > 0
      ? Number((((currentMonthEnrollments.length - lastMonthEnrollments.length) / lastMonthEnrollments.length) * 100).toFixed(1))
      : currentMonthEnrollments.length > 0 ? 100 : 0;

    // 7. Popular courses with real average completion rates and authoritative per-course revenue
    const popularCourses = courseList.map((c) => {
      const cEnrollments = allEnrollments.filter((e) => e.course_id === c.id);
      const studentCount = cEnrollments.length > 0 ? cEnrollments.length : (c.students_enrolled || 0);
      const avgCompletion = cEnrollments.length > 0
        ? Math.round(cEnrollments.reduce((acc, e) => acc + (Number(e.completion_percentage) || 0), 0) / cEnrollments.length)
        : 0;
      const cRev = courseRevenueMap.get(c.id) || 0;

      return {
        id: c.id,
        title: c.title,
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        studentsCount: studentCount,
        enrolledStudents: studentCount,
        rating: Number(c.rating) || 5.0,
        completionRate: avgCompletion,
        revenueINR: cRev,
      };
    }).sort((a, b) => b.studentsCount - a.studentsCount).slice(0, 5);

    // 8. Build Aggregated Recent Activity Feed
    const activityFeed: any[] = [];

    // Add recent enrollments
    allEnrollments.slice(0, 8).forEach((e) => {
      const c = courseList.find((course) => course.id === e.course_id);
      const stName = e.profiles?.full_name || 'Student';
      const d = e.enrolled_at ? new Date(e.enrolled_at) : new Date();
      activityFeed.push({
        id: `act-enr-${e.id}`,
        studentName: stName,
        studentAvatar: e.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(stName)}&background=6366f1&color=fff`,
        actionText: `enrolled in "${c?.title || 'Course'}"`,
        timestamp: d.toISOString(),
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        type: 'enrollment',
      });
    });

    // Add recent assignment submissions
    recentSubmissions.slice(0, 6).forEach((s) => {
      const stName = s.profiles?.full_name || 'Student';
      const d = s.submitted_at ? new Date(s.submitted_at) : new Date();
      activityFeed.push({
        id: `act-sub-${s.id}`,
        studentName: stName,
        studentAvatar: s.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(stName)}&background=f43f5e&color=fff`,
        actionText: `submitted assignment "${s.assignmentTitle}" in ${s.courseTitle}`,
        timestamp: d.toISOString(),
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        type: 'assignment',
      });
    });

    // Sort activityFeed descending by timestamp
    activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalStudents,
      assignmentsPendingReview,
      quizzesPendingReview,
      liveClassesScheduled,
      totalRevenueINR,
      monthlyRevenueINR,
      revenueTrendPercent,
      studentsTrendPercent,
      popularCourses,
      monthlyTrendData,
      activityFeed: activityFeed.slice(0, 8),
    };
  }

  /**
   * 4. Create New Course (Instructor)
   */
  public async createCourse(
    instructorProfileId: string,
    input: {
      title: string;
      shortDescription?: string;
      fullDescription?: string;
      categoryId?: string;
      category?: string;
      subcategory?: string;
      difficulty?: string;
      language?: string;
      thumbnail: string;
      promoVideoUrl?: string;
      price: number;
      discountPrice?: number;
      tags?: string[];
      requirements?: string[];
      learningOutcomes?: string[];
      isSubmitForApproval?: boolean;
    }
  ): Promise<Course> {
    // Generate unique slug quickly with random suffix fallback or single lookup
    const baseSlug = input.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'course';
    const { data: existingSlugs } = await supabaseAdmin
      .from('courses')
      .select('slug')
      .ilike('slug', `${baseSlug}%`)
      .limit(20);

    let slug = baseSlug;
    if (existingSlugs && existingSlugs.length > 0) {
      const slugSet = new Set(existingSlugs.map((s) => s.slug));
      let counter = 1;
      while (slugSet.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Resolve Category ID if name was provided and ID wasn't
    let categoryId = input.categoryId;
    if (!categoryId && input.category && input.category !== 'General') {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .ilike('name', input.category.trim())
        .maybeSingle();

      if (cat) categoryId = cat.id;
    }

    const priceNum = Number(input.price) || 0;
    const discountNum = input.discountPrice !== undefined ? Number(input.discountPrice) : undefined;
    let priceType: CoursePriceType = 'Paid';
    if (priceNum === 0) priceType = 'Free';
    else if (discountNum && discountNum > 0 && discountNum < priceNum) priceType = 'Discounted';

    const courseStatus = 'Draft';
    const approvalStatus = input.isSubmitForApproval ? 'Pending Approval' : 'Draft';

    const { data: newCourse, error } = await supabaseAdmin
      .from('courses')
      .insert({
        instructor_id: instructorProfileId,
        category_id: categoryId || null,
        subcategory: input.subcategory || null,
        title: input.title.trim(),
        slug,
        short_description: input.shortDescription || '',
        full_description: input.fullDescription || '',
        difficulty: input.difficulty || 'Beginner',
        language: input.language || 'English',
        thumbnail: input.thumbnail,
        promo_video_url: input.promoVideoUrl || '',
        price: priceNum,
        discount_price: discountNum,
        price_type: priceType,
        course_status: courseStatus,
        approval_status: approvalStatus,
        tags: input.tags || [],
        requirements: input.requirements || [],
        learning_outcomes: input.learningOutcomes || [],
      })
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .single();

    if (error || !newCourse) {
      logger.error('Error inserting course:', error);
      throw ApiError.badRequest(error?.message || 'Failed to create course');
    }

    return this.formatCourse(newCourse);
  }

  /**
   * 5. Update Instructor Course (Enforces verified ownership and protects approval/aggregate fields)
   */
  public async updateInstructorCourse(
    instructorProfileId: string,
    courseId: string,
    updates: any
  ): Promise<Course> {
    // 1. Fetch course and verify ownership
    const { data: course, error: fetchError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (fetchError || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.instructor_id !== instructorProfileId) {
      throw ApiError.forbidden('Forbidden: You can only edit courses that you own');
    }

    if (course.course_status === 'Published') {
      throw ApiError.forbidden(
        'Published courses are locked from direct modification to protect enrolled students and certificate validity.'
      );
    }

    // 2. Prepare allowed updates

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) {
      payload.title = updates.title.trim();
    }
    if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription;
    if (updates.fullDescription !== undefined) payload.full_description = updates.fullDescription;
    if (updates.subcategory !== undefined) payload.subcategory = updates.subcategory;
    if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
    if (updates.language !== undefined) payload.language = updates.language;
    if (updates.thumbnail !== undefined) payload.thumbnail = updates.thumbnail;
    if (updates.promoVideoUrl !== undefined) payload.promo_video_url = updates.promoVideoUrl;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.requirements !== undefined) payload.requirements = updates.requirements;
    if (updates.learningOutcomes !== undefined) payload.learning_outcomes = updates.learningOutcomes;

    if (updates.categoryId !== undefined) {
      payload.category_id = updates.categoryId;
    } else if (updates.category) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .ilike('name', updates.category.trim())
        .maybeSingle();
      if (cat) payload.category_id = cat.id;
    }

    if (updates.price !== undefined) {
      const priceNum = Number(updates.price) || 0;
      payload.price = priceNum;
      const discountNum = updates.discountPrice !== undefined ? Number(updates.discountPrice) : course.discount_price;
      if (priceNum === 0) payload.price_type = 'Free';
      else if (discountNum && discountNum > 0 && discountNum < priceNum) payload.price_type = 'Discounted';
      else payload.price_type = 'Paid';
    }

    if (updates.discountPrice !== undefined) {
      payload.discount_price = Number(updates.discountPrice) || null;
    }

    // Workflow submission handling
    if (updates.isSubmitForApproval === true) {
      payload.approval_status = 'Pending Approval';
      payload.rejection_reason = null;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('courses')
      .update(payload)
      .eq('id', courseId)
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .single();

    if (updateError || !updated) {
      throw ApiError.badRequest(updateError?.message || 'Failed to update course');
    }

    return this.formatCourse(updated);
  }

  /**
   * 5b. Get Single Instructor Course by ID (Verifies ownership)
   */
  public async getInstructorCourseById(instructorProfileId: string, courseId: string): Promise<Course> {
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.instructor_id !== instructorProfileId) {
      throw ApiError.forbidden('Forbidden: You can only view details of your own courses');
    }

    return this.formatCourse(course);
  }

  /**
   * 5b. Validate Course Completion Checklist
   */
  public async validateCourseCompletion(
    instructorProfileId: string,
    courseId: string
  ): Promise<CourseCompletionSummary> {
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseErr || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.instructor_id !== instructorProfileId) {
      // Allow admin to check completion
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', instructorProfileId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminProfile) {
        throw ApiError.forbidden('Forbidden: You can only check completion for courses you own');
      }
    }

    const missingItems: string[] = [];

    // 1. Course Information Check
    let courseInfoComplete = true;
    if (!course.title || course.title.trim() === '') {
      courseInfoComplete = false;
      missingItems.push('Course title is required');
    }
    if (!course.category_id && !course.category) {
      courseInfoComplete = false;
      missingItems.push('Course category is required');
    }
    if (!course.short_description || course.short_description.trim() === '') {
      courseInfoComplete = false;
      missingItems.push('Course short description is required');
    }
    if (!course.thumbnail || course.thumbnail.trim() === '') {
      courseInfoComplete = false;
      missingItems.push('Course thumbnail is required');
    }
    if (!course.difficulty) {
      courseInfoComplete = false;
      missingItems.push('Course difficulty level is required');
    }
    if (!course.language) {
      courseInfoComplete = false;
      missingItems.push('Course language is required');
    }

    // 2. Modules & Lessons Check
    const { data: modules } = await supabaseAdmin
      .from('course_modules')
      .select('id, title, position, lessons(*)')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    let curriculumComplete = true;
    let contentComplete = true;
    const modulesCount = modules ? modules.length : 0;
    let lessonsCount = 0;

    if (!modules || modules.length === 0) {
      curriculumComplete = false;
      contentComplete = false;
      missingItems.push('Curriculum requires at least 1 module');
    } else {
      modules.forEach((mod, modIdx) => {
        if (!mod.title || mod.title.trim() === '') {
          curriculumComplete = false;
          missingItems.push(`Module ${modIdx + 1} is missing a title`);
        }
        const lessons = (mod.lessons as any[]) || [];
        lessonsCount += lessons.length;

        if (lessons.length === 0) {
          curriculumComplete = false;
          contentComplete = false;
          missingItems.push(`Module "${mod.title || modIdx + 1}" has no lessons`);
        } else {
          lessons.forEach((les, lesIdx) => {
            const lesName = les.title || `Lesson ${lesIdx + 1}`;
            if (!les.title || les.title.trim() === '') {
              curriculumComplete = false;
              missingItems.push(`A lesson in module "${mod.title}" is missing a title`);
            }

            const type = les.lesson_type;
            if (type === 'Video') {
              if (!les.video_url || les.video_url.trim() === '') {
                contentComplete = false;
                missingItems.push(`Video lesson "${lesName}" has no video URL or upload`);
              }
            } else if (type === 'PDF') {
              if (!les.document_url || les.document_url.trim() === '') {
                contentComplete = false;
                missingItems.push(`PDF lesson "${lesName}" has no document URL or upload`);
              }
            } else if (type === 'Text') {
              if (!les.content || les.content.trim() === '') {
                contentComplete = false;
                missingItems.push(`Text lesson "${lesName}" has no content`);
              }
            } else if (type === 'Resource') {
              if (!les.resource_url || les.resource_url.trim() === '') {
                contentComplete = false;
                missingItems.push(`Resource lesson "${lesName}" has no resource URL or upload`);
              }
            }
          });
        }
      });
    }

    // 3. Assignments Check
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, title, max_score, passing_score, status')
      .eq('course_id', courseId);

    let assignmentsComplete = true;
    const assignmentsCount = assignments ? assignments.length : 0;

    if (!assignments || assignments.length === 0) {
      assignmentsComplete = false;
      missingItems.push('Course requires at least 1 assignment');
    } else {
      let publishedCount = 0;
      assignments.forEach((asg, idx) => {
        if (!asg.title || asg.title.trim() === '') {
          assignmentsComplete = false;
          missingItems.push(`Assignment ${idx + 1} is missing a title`);
        }
        if (asg.status === 'Draft') {
          assignmentsComplete = false;
          missingItems.push(`Assignment "${asg.title || idx + 1}" is in Draft status (must be published)`);
        } else {
          publishedCount++;
        }
        if (Number(asg.max_score) <= 0) {
          assignmentsComplete = false;
          missingItems.push(`Assignment "${asg.title || idx + 1}" max score must be greater than 0`);
        }
      });
      if (publishedCount === 0) {
        assignmentsComplete = false;
        missingItems.push('Course requires at least 1 published assignment');
      }
    }

    // 4. Quizzes Check
    const { data: dbQuizzes } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, status, quiz_type, passing_score, quiz_questions(id, question_text, question_type, options, correct_answer, points)')
      .eq('course_id', courseId);

    let quizzesComplete = true;
    const quizzesList = dbQuizzes || [];
    const quizzesCount = quizzesList.length;

    if (!dbQuizzes || dbQuizzes.length === 0) {
      quizzesComplete = false;
      missingItems.push('Course requires at least 1 quiz');
    } else {
      let validPublishedQuizzes = 0;
      quizzesList.forEach((q: any, idx: number) => {
        const qName = q.title || `Quiz ${idx + 1}`;
        if (!q.title || q.title.trim() === '') {
          quizzesComplete = false;
          missingItems.push(`Quiz ${idx + 1} is missing a title`);
        }
        if (q.status === 'Draft') {
          quizzesComplete = false;
          missingItems.push(`Quiz "${qName}" is in Draft status (must be published)`);
        }
        const questions = (q.quiz_questions as any[]) || [];
        if (questions.length === 0) {
          quizzesComplete = false;
          missingItems.push(`Quiz "${qName}" must have at least 1 question`);
        } else {
          // Validate individual questions in the quiz
          let quizQuestionsValid = true;
          questions.forEach((question, qIdx) => {
            const qNum = qIdx + 1;
            if (!question.question_text || question.question_text.trim() === '') {
              quizQuestionsValid = false;
              missingItems.push(`Quiz "${qName}" Question ${qNum}: Question text is required`);
            }
            const qType = question.question_type;
            const validTypes = ['Single Answer', 'Multiple Answer', 'Fill in the Blanks', 'True or False'];
            if (!validTypes.includes(qType)) {
              quizQuestionsValid = false;
              missingItems.push(`Quiz "${qName}" Question ${qNum}: Invalid question type "${qType}"`);
            }

            if (qType === 'Single Answer' || qType === 'Multiple Answer') {
              const opts = Array.isArray(question.options) ? question.options : [];
              if (opts.length < 2) {
                quizQuestionsValid = false;
                missingItems.push(`Quiz "${qName}" Question ${qNum} (${qType}): Requires at least 2 options`);
              }
            } else if (qType === 'Fill in the Blanks') {
              if (!question.correct_answer || String(question.correct_answer).trim() === '') {
                quizQuestionsValid = false;
                missingItems.push(`Quiz "${qName}" Question ${qNum} (Fill in the Blanks): Correct answer is required`);
              }
            }
          });

          if (quizQuestionsValid && q.status === 'Published') {
            validPublishedQuizzes++;
          }
        }
      });

      if (validPublishedQuizzes === 0) {
        quizzesComplete = false;
        missingItems.push('Course requires at least 1 valid published quiz with questions');
      }
    }

    const courseComplete =
      courseInfoComplete &&
      curriculumComplete &&
      contentComplete &&
      assignmentsComplete &&
      quizzesComplete &&
      missingItems.length === 0;

    return {
      courseComplete,
      courseInfoComplete,
      curriculumComplete,
      contentComplete,
      assignmentsComplete,
      quizzesComplete,
      modulesCount,
      lessonsCount,
      assignmentsCount,
      quizzesCount,
      missingItems,
    };
  }

  /**
   * 5c. Submit Course for Admin Approval
   */
  public async submitCourseForApproval(instructorProfileId: string, courseId: string): Promise<Course> {
    const completion = await this.validateCourseCompletion(instructorProfileId, courseId);

    if (!completion.courseComplete) {
      throw ApiError.badRequest(
        `Cannot submit course for approval. Missing requirements: ${completion.missingItems.join(', ')}`
      );
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('courses')
      .update({
        course_status: 'Draft',
        approval_status: 'Pending Approval',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .single();

    if (updateError || !updated) {
      throw ApiError.badRequest(updateError?.message || 'Failed to submit course for approval');
    }

    // Dispatch notification to Admins (asynchronous & non-blocking)
    try {
      const { data: adminUsers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map((adm) => ({
          userId: adm.id,
          title: 'Course Submitted for Approval',
          message: `Instructor submitted "${updated.title}" for approval.`,
          type: 'info' as const,
          category: 'course' as const,
          actionUrl: '/admin/courses',
          sourceId: courseId,
        }));
        await NotificationService.createBulkNotifications(notifications);
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch course submission notification: ${notifErr.message}`);
    }

    return this.formatCourse(updated);
  }

  /**
   * 6. Delete Instructor Course (Enforces verified ownership)
   */
  public async deleteInstructorCourse(instructorProfileId: string, courseId: string): Promise<void> {
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, instructor_id, course_status, students_enrolled')
      .eq('id', courseId)
      .maybeSingle();

    if (error || !course) {
      throw ApiError.notFound('Course not found');
    }

    if (course.instructor_id !== instructorProfileId) {
      throw ApiError.forbidden('Forbidden: You can only delete courses that you own');
    }

    if (course.course_status === 'Published' || (Number(course.students_enrolled) || 0) > 0) {
      throw ApiError.forbidden(
        'Published courses with active students cannot be deleted. Please contact platform administration to archive.'
      );
    }

    const { error: delError } = await supabaseAdmin.from('courses').delete().eq('id', courseId);

    if (delError) {
      throw ApiError.badRequest(delError.message);
    }
  }

  /**
   * 7. Admin List All Courses
   */
  public async getAdminCourses(filters: CourseQueryFilters) {
    let query = supabaseAdmin
      .from('courses')
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)', { count: 'exact' });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
    }

    if (filters.approvalStatus && filters.approvalStatus !== 'All') {
      query = query.eq('approval_status', filters.approvalStatus);
    } else {
      // By default, Admin Course Management only lists courses submitted for approval (Pending Approval, Approved, Rejected, Archived)
      // and NOT incomplete private instructor drafts.
      query = query.in('approval_status', ['Pending Approval', 'Approved', 'Rejected', 'Archived']);
    }

    if (filters.courseStatus && filters.courseStatus !== 'All') {
      query = query.eq('course_status', filters.courseStatus);
    }

    if (filters.category && filters.category !== 'All') {
      const { data: cat } = await supabaseAdmin.from('categories').select('id').ilike('name', filters.category).maybeSingle();
      if (cat) query = query.eq('category_id', cat.id);
    }

    query = query.order('created_at', { ascending: false });

    const { data: rows, count, error } = await query;
    if (error) {
      logger.error('Error fetching admin courses:', error);
      throw ApiError.internal('Failed to retrieve courses for admin review');
    }

    const courses = (rows || []).map((row) => this.formatCourse(row));
    return { courses, total: count || 0 };
  }

  /**
   * 8. Admin Approve Course (Approve + Publish to catalog)
   */
  public async approveCourse(adminProfileId: string, courseId: string): Promise<Course> {
    const { data: course, error: fetchErr } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (fetchErr || !course) {
      throw ApiError.notFound('Course not found');
    }

    const previousStatus = course.approval_status;

    // Update Course to Approved + Published
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('courses')
      .update({
        approval_status: 'Approved',
        course_status: 'Published',
        rejection_reason: null,
      })
      .eq('id', courseId)
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .single();

    if (updateErr || !updated) {
      throw ApiError.badRequest(updateErr?.message || 'Failed to approve course');
    }

    // Log Approval Audit Review
    await supabaseAdmin.from('course_approval_reviews').insert({
      course_id: courseId,
      reviewed_by: adminProfileId,
      previous_status: previousStatus,
      new_status: 'Approved',
      feedback: 'Course approved and published to platform catalog.',
    });

    // Dispatch notification to Instructor (asynchronous & non-blocking)
    try {
      if (updated.instructor_id) {
        await NotificationService.createNotification({
          userId: updated.instructor_id,
          title: `Course Approved: ${updated.title}`,
          message: `Congratulations! Your course "${updated.title}" has been approved and published to the catalog.`,
          type: 'success',
          category: 'course',
          actionUrl: '/instructor/courses',
          sourceId: courseId,
        });
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch course approval notification: ${notifErr.message}`);
    }

    return this.formatCourse(updated);
  }

  /**
   * 9. Admin Reject Course (Reject with Feedback)
   */
  public async rejectCourse(adminProfileId: string, courseId: string, rejectionReason: string): Promise<Course> {
    const { data: course, error: fetchErr } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (fetchErr || !course) {
      throw ApiError.notFound('Course not found');
    }

    const previousStatus = course.approval_status;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('courses')
      .update({
        approval_status: 'Rejected',
        course_status: 'Draft',
        rejection_reason: rejectionReason.trim(),
      })
      .eq('id', courseId)
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .single();

    if (updateErr || !updated) {
      throw ApiError.badRequest(updateErr?.message || 'Failed to reject course');
    }

    // Log Rejection Audit Review
    await supabaseAdmin.from('course_approval_reviews').insert({
      course_id: courseId,
      reviewed_by: adminProfileId,
      previous_status: previousStatus,
      new_status: 'Rejected',
      feedback: rejectionReason.trim(),
    });

    // Dispatch notification to Instructor (asynchronous & non-blocking)
    try {
      if (updated.instructor_id) {
        await NotificationService.createNotification({
          userId: updated.instructor_id,
          title: `Course Revision Requested: ${updated.title}`,
          message: `Changes requested for "${updated.title}": ${rejectionReason.trim()}`,
          type: 'warning',
          category: 'course',
          actionUrl: '/instructor/courses',
          sourceId: courseId,
        });
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch course rejection notification: ${notifErr.message}`);
    }

    return this.formatCourse(updated);
  }

  /**
   * 10. Admin Delete Course
   */
  public async deleteAdminCourse(courseId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', courseId);
    if (error) {
      throw ApiError.badRequest(error.message);
    }
  }

  /**
   * 11. Admin Get Full Course Review Details
   */
  public async getAdminCourseReviewDetails(courseId: string) {
    // 1. Fetch Course details
    const { data: courseRow, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('*, profiles:instructor_id(*), categories:category_id(name)')
      .eq('id', courseId)
      .maybeSingle();

    if (courseErr || !courseRow) {
      throw ApiError.notFound('Course not found');
    }

    const course = this.formatCourse(courseRow);
    const instructorProfile = courseRow.profiles || {};

    // 2. Fetch Instructor details
    const instructor = {
      id: instructorProfile.id || course.instructorId,
      name: instructorProfile.full_name || course.instructorName || 'EduSphere Instructor',
      email: instructorProfile.email || 'instructor@edusphere.com',
      photoUrl: instructorProfile.avatar_url || course.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: instructorProfile.bio || 'Professional EduSphere Course Instructor & Subject Matter Expert.',
      qualification: instructorProfile.qualification || instructorProfile.headline || 'Certified Specialist',
      experienceYears: parseInt(instructorProfile.experience || '5', 10) || 5,
      totalPublishedCourses: instructorProfile.courses_created_count || 1,
    };

    // 3. Fetch Curriculum (Modules + Lessons)
    const { data: modulesData } = await supabaseAdmin
      .from('course_modules')
      .select('*, lessons(*)')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    const sections = await Promise.all(
      (modulesData || []).map(async (m: any, mIdx: number) => {
        const sortedLessons = (m.lessons || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        
        const mappedLessons = await Promise.all(
          sortedLessons.map(async (l: any) => {
            let playableVideoUrl = l.video_url || undefined;
            if (playableVideoUrl && !playableVideoUrl.startsWith('http://') && !playableVideoUrl.startsWith('https://')) {
              try {
                playableVideoUrl = await StorageService.createSignedLessonVideoUrl(playableVideoUrl, 86400);
              } catch {
                // Keep raw path or fallback
              }
            }

            let readablePdfUrl = l.document_url || undefined;
            if (readablePdfUrl && !readablePdfUrl.startsWith('http://') && !readablePdfUrl.startsWith('https://')) {
              try {
                readablePdfUrl = await StorageService.createSignedLessonDocumentUrl(readablePdfUrl, 86400);
              } catch {
                // Keep raw path
              }
            }

            // Parse resource URL if any
            const resources = l.resource_url
              ? [
                  {
                    id: `res-${l.id}`,
                    name: `${l.title} Resources`,
                    size: '1.2 MB',
                    fileType: 'PDF' as const,
                    downloadUrl: l.resource_url,
                  },
                ]
              : [];

            return {
              id: l.id,
              sectionId: m.id,
              sectionTitle: m.title || `Module ${mIdx + 1}`,
              title: l.title,
              type: (l.lesson_type || 'Video') as 'Video' | 'PDF' | 'Text' | 'Resource',
              durationMinutes: Number(l.duration_minutes) || 10,
              status: 'Published' as const,
              videoUrl: playableVideoUrl,
              pdfUrl: readablePdfUrl,
              pdfPageCount: 1,
              textContent: l.content || undefined,
              resources,
            };
          })
        );

        return {
          id: m.id,
          title: m.title || `Module ${mIdx + 1}`,
          description: m.description || '',
          order: m.position !== undefined ? m.position : mIdx + 1,
          lessons: mappedLessons,
        };
      })
    );

    // 4. Fetch Assignments
    const { data: assignmentsData } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    const assignments = (assignmentsData || []).map((a: any) => {
      let instructionsList: string[] = [];
      if (a.instructions) {
        if (typeof a.instructions === 'string') {
          instructionsList = a.instructions.split('\n').filter(Boolean);
        } else if (Array.isArray(a.instructions)) {
          instructionsList = a.instructions;
        }
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description || '',
        instructions: instructionsList.length > 0 ? instructionsList : ['Follow the assignment instructions as detailed.'],
        maxMarks: Number(a.max_score) || 100,
        passingMarks: Number(a.passing_score) || 60,
        isMandatory: true,
        attachmentFileName: undefined,
        attachmentSize: undefined,
        attachmentUrl: undefined,
      };
    });

    // 5. Fetch Quizzes & Quiz Questions
    const { data: quizzesData } = await supabaseAdmin
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    const quizzes = (quizzesData || []).map((q: any) => {
      const sortedQuestions = (q.quiz_questions || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
      return {
        id: q.id,
        title: q.title,
        description: q.description || '',
        passingMarks: Number(q.passing_score) || 70,
        timeLimitMinutes: Number(q.time_limit_minutes) || 15,
        maxAttempts: Number(q.max_attempts) || 3,
        questions: sortedQuestions.map((ques: any) => {
          let opts = [];
          if (Array.isArray(ques.options)) {
            opts = ques.options.map((o: any) => ({
              id: o.id || `opt-${Math.random().toString(36).substr(2, 9)}`,
              text: typeof o === 'string' ? o : o.text || '',
              isCorrect: Boolean(o.isCorrect),
            }));
          }

          let fillBlankAnswer: string | undefined;
          if (ques.question_type === 'Fill in the Blanks') {
            fillBlankAnswer = ques.correct_answer?.answer || (typeof ques.correct_answer === 'string' ? ques.correct_answer : '');
          }

          return {
            id: ques.id,
            questionType: ques.question_type,
            questionText: ques.question_text,
            options: opts.length > 0 ? opts : undefined,
            fillBlankAnswer,
            explanation: ques.explanation || undefined,
          };
        }),
      };
    });

    // 6. Calculate real Course Completion Validation
    const completion = await this.validateCourseCompletion(course.instructorId, courseId);

    return {
      courseId: course.id,
      thumbnail: course.thumbnail,
      promoVideoUrl: course.promoVideoUrl,
      title: course.title,
      instructorName: instructor.name,
      category: course.category,
      language: course.language,
      difficulty: course.difficulty,
      price: course.price,
      discountPrice: course.discountPrice,
      priceType: course.priceType,
      fullDescription: course.fullDescription || course.shortDescription,
      learningOutcomes: course.learningOutcomes || [],
      requirements: course.requirements || [],
      submissionDate: course.createdAt ? new Date(course.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently',
      course,
      instructor,
      sections,
      assignments,
      quizzes,
      completion,
    };
  }

  /**
   * Public Platform Statistics for landing page
   */
  public async getPublicPlatformStats(): Promise<{
    activeStudents: number;
    expertInstructors: number;
    publishedCourses: number;
    certificatesAwarded: number;
  }> {
    try {
      const [
        { count: studentsCount },
        { count: instructorsCount },
        { count: coursesCount },
        { count: certificatesCount },
      ] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .eq('status', 'active'),
        supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'instructor')
          .eq('instructor_approval_status', 'approved'),
        supabaseAdmin
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('course_status', 'Published')
          .eq('approval_status', 'Approved'),
        supabaseAdmin
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Completed'),
      ]);

      return {
        activeStudents: studentsCount || 0,
        expertInstructors: instructorsCount || 0,
        publishedCourses: coursesCount || 0,
        certificatesAwarded: certificatesCount || 0,
      };
    } catch (err) {
      logger.error('Error fetching public platform stats:', err);
      return {
        activeStudents: 0,
        expertInstructors: 0,
        publishedCourses: 0,
        certificatesAwarded: 0,
      };
    }
  }

  /**
   * Public Executive & Academic Leadership for About Page
   */
  public async getPublicLeadership(): Promise<{
    id: string;
    name: string;
    role: string;
    photo: string;
    bio: string;
    qualification?: string;
    specialization?: string;
  }[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, role, bio, headline, specialization, qualification, instructor_approval_status')
        .in('role', ['admin', 'instructor'])
        .or('role.eq.admin,instructor_approval_status.eq.approved')
        .order('created_at', { ascending: true })
        .limit(6);

      if (error || !data) {
        logger.error('Error fetching public leadership:', error);
        return [];
      }

      // Filter to unique and distinct active leaders
      const filtered = data.filter((p) => p.full_name && p.full_name.trim().length > 0);

      return filtered.map((p) => {
        let displayRole = p.role === 'admin' ? 'Founder & Platform Administrator' : 'Lead Faculty & Instructor';
        if (p.headline) {
          displayRole = p.headline;
        } else if (p.specialization && p.role === 'instructor' && !p.specialization.includes('@')) {
          displayRole = `${p.specialization} Instructor`;
        }

        const bio = p.bio || (p.qualification ? `${p.qualification.toUpperCase()} with expertise in modern educational technologies.` : 'Dedicated academic mentor shaping the next generation of digital leaders.');

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=4f46e5&color=fff&size=200`;
        const photo = p.avatar_url && !p.avatar_url.includes('photo-1534528741775-53994a69daeb')
          ? p.avatar_url
          : defaultAvatar;

        return {
          id: p.id,
          name: p.full_name,
          role: displayRole,
          photo,
          bio,
          qualification: p.qualification || undefined,
          specialization: p.specialization && !p.specialization.includes('@') ? p.specialization : undefined,
        };
      });
    } catch (err) {
      logger.error('Error in getPublicLeadership:', err);
      return [];
    }
  }
}

export const courseService = new CourseService();

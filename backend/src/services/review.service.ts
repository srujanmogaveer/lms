import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/apiResponse';
import {
  CourseReviewItem,
  CourseRatingBreakdown,
  CourseReviewsResponse,
  CreateReviewDto,
} from '../types';
import { logger } from '../utils/logger';


export class ReviewService {
  // In-memory fallback cache for development/resilience
  private static inMemoryReviews: CourseReviewItem[] = [];

  /**
   * Recalculate aggregate ratings on course and instructor
   */
  private static async recalculateAggregates(courseId: string, allReviews: CourseReviewItem[]) {
    try {
      const courseReviews = allReviews.filter((r) => r.courseId === courseId);
      const count = courseReviews.length;
      const avg = count > 0
        ? Number((courseReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(2))
        : 5.0;

      // Update course rating and reviews_count
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .update({
          rating: avg,
          reviews_count: count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select('instructor_id')
        .single();

      // Recalculate instructor average rating
      const instructorId = courseRow?.instructor_id;
      if (instructorId) {
        const { data: instructorCourses } = await supabaseAdmin
          .from('courses')
          .select('rating, reviews_count')
          .eq('instructor_id', instructorId)
          .gt('reviews_count', 0);

        let instructorAvg = 5.0;
        if (instructorCourses && instructorCourses.length > 0) {
          const totalCourseRating = instructorCourses.reduce((sum, c) => sum + (Number(c.rating) || 5.0), 0);
          instructorAvg = Number((totalCourseRating / instructorCourses.length).toFixed(2));
        }

        await supabaseAdmin
          .from('profiles')
          .update({
            instructor_rating: instructorAvg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', instructorId);
      }
    } catch (err: any) {
      logger.warn('Failed to update rating aggregates in Supabase:', err.message);
    }
  }

  /**
   * Helper: Calculate rating distribution summary
   */
  private static calculateSummary(reviews: CourseReviewItem[]): CourseRatingBreakdown {
    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        distribution: {
          5: { count: 0, percentage: 0 },
          4: { count: 0, percentage: 0 },
          3: { count: 0, percentage: 0 },
          2: { count: 0, percentage: 0 },
          1: { count: 0, percentage: 0 },
        },
      };
    }

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of reviews) {
      const roundedStar = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[roundedStar] = (counts[roundedStar] || 0) + 1;
      sum += r.rating;
    }

    const averageRating = Number((sum / totalReviews).toFixed(1));

    return {
      averageRating,
      totalReviews,
      distribution: {
        5: { count: counts[5], percentage: Math.round((counts[5] / totalReviews) * 100) },
        4: { count: counts[4], percentage: Math.round((counts[4] / totalReviews) * 100) },
        3: { count: counts[3], percentage: Math.round((counts[3] / totalReviews) * 100) },
        2: { count: counts[2], percentage: Math.round((counts[2] / totalReviews) * 100) },
        1: { count: counts[1], percentage: Math.round((counts[1] / totalReviews) * 100) },
      },
    };
  }

  /**
   * Get all reviews for a course (with rating breakdown and pagination)
   */
  public static async getCourseReviews(
    courseId: string,
    page = 1,
    limit = 10,
    ratingFilter?: number,
    sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest'
  ): Promise<CourseReviewsResponse> {
    let allCourseReviews: CourseReviewItem[] = [];

    try {
      const { data, error } = await supabaseAdmin
        .from('course_reviews')
        .select(`
          id,
          course_id,
          student_id,
          rating,
          review_title,
          review_text,
          helpful_count,
          created_at,
          updated_at,
          profiles:student_id (
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        allCourseReviews = data.map((r: any) => ({
          id: r.id,
          courseId: r.course_id,
          studentId: r.student_id,
          studentName: r.profiles?.full_name || 'Verified Student',
          studentAvatar: r.profiles?.avatar_url || '',
          rating: Number(r.rating) || 5,
          reviewTitle: r.review_title || '',
          reviewText: r.review_text || '',
          helpfulCount: r.helpful_count || 0,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      } else {
        allCourseReviews = this.inMemoryReviews.filter((r) => r.courseId === courseId);
      }
    } catch {
      allCourseReviews = this.inMemoryReviews.filter((r) => r.courseId === courseId);
    }

    // Merge in-memory reviews if not in DB
    const existingIds = new Set(allCourseReviews.map((r) => r.id));
    for (const memRev of this.inMemoryReviews) {
      if (memRev.courseId === courseId && !existingIds.has(memRev.id)) {
        allCourseReviews.push(memRev);
      }
    }

    const summary = this.calculateSummary(allCourseReviews);

    // Apply Star Filter
    let filteredReviews = allCourseReviews;
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filteredReviews = filteredReviews.filter((r) => Math.round(r.rating) === ratingFilter);
    }

    // Sort
    if (sortBy === 'newest') {
      filteredReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filteredReviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'highest') {
      filteredReviews.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      filteredReviews.sort((a, b) => a.rating - b.rating);
    }

    // Paginate
    const total = filteredReviews.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = filteredReviews.slice(offset, offset + limit);

    return {
      reviews: paginated,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get student's personal review for a course
   */
  public static async getStudentCourseReview(studentId: string, courseId: string): Promise<CourseReviewItem | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('course_reviews')
        .select(`
          id,
          course_id,
          student_id,
          rating,
          review_title,
          review_text,
          helpful_count,
          created_at,
          updated_at,
          profiles:student_id (
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          courseId: data.course_id,
          studentId: data.student_id,
          studentName: (data.profiles as any)?.full_name || 'You',
          studentAvatar: (data.profiles as any)?.avatar_url || '',
          rating: Number(data.rating) || 5,
          reviewTitle: data.review_title || '',
          reviewText: data.review_text || '',
          helpfulCount: data.helpful_count || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fallback
    }

    const mem = this.inMemoryReviews.find((r) => r.courseId === courseId && r.studentId === studentId);
    return mem || null;
  }

  /**
   * Submit or update a student's review for a course (Upsert)
   */
  public static async upsertReview(
    studentId: string,
    courseId: string,
    data: CreateReviewDto
  ): Promise<CourseReviewItem> {
    // 1. Verify student profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', studentId)
      .single();

    // 2. Verify course enrollment
    const { data: enrollment, error: enrollErr } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollErr || !enrollment) {
      // If student is admin or test user, allow, else enforce enrollment check
      if (profile?.role !== 'admin') {
        throw ApiError.badRequest('You must be enrolled in this course to submit a rating and review.');
      }
    }

    // 3. Verify that student has completed all lessons
    if (profile?.role !== 'admin') {
      const { data: modules } = await supabaseAdmin
        .from('course_modules')
        .select('id, lessons(id)')
        .eq('course_id', courseId);

      const allLessonIds = (modules || []).flatMap((m: any) => (m.lessons || []).map((l: any) => l.id));
      const totalLessons = allLessonIds.length;

      if (totalLessons > 0) {
        const { data: progressRows } = await supabaseAdmin
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .eq('status', 'Completed');

        const completedLessons = (progressRows || []).length;
        if (completedLessons < totalLessons) {
          throw ApiError.badRequest(
            `You can only submit a course rating and review after completing all lessons (${completedLessons} of ${totalLessons} completed).`
          );
        }
      }
    }

    const now = new Date().toISOString();
    let savedReview: CourseReviewItem;

    try {
      const { data: existing } = await supabaseAdmin
        .from('course_reviews')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from('course_reviews')
          .update({
            rating: data.rating,
            review_title: data.reviewTitle || '',
            review_text: data.reviewText,
            updated_at: now,
          })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (updateErr) throw updateErr;

        savedReview = {
          id: updated.id,
          courseId: updated.course_id,
          studentId: updated.student_id,
          studentName: profile?.full_name || 'Verified Student',
          studentAvatar: profile?.avatar_url || '',
          rating: Number(updated.rating),
          reviewTitle: updated.review_title,
          reviewText: updated.review_text,
          helpfulCount: updated.helpful_count || 0,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
        };
      } else {
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('course_reviews')
          .insert({
            course_id: courseId,
            student_id: studentId,
            rating: data.rating,
            review_title: data.reviewTitle || '',
            review_text: data.reviewText,
            helpful_count: 0,
            created_at: now,
            updated_at: now,
          })
          .select('*')
          .single();

        if (insertErr) throw insertErr;

        savedReview = {
          id: inserted.id,
          courseId: inserted.course_id,
          studentId: inserted.student_id,
          studentName: profile?.full_name || 'Verified Student',
          studentAvatar: profile?.avatar_url || '',
          rating: Number(inserted.rating),
          reviewTitle: inserted.review_title,
          reviewText: inserted.review_text,
          helpfulCount: inserted.helpful_count || 0,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };
      }
    } catch (dbErr: any) {
      logger.warn('Direct DB operation on course_reviews failed, using resilient fallback:', dbErr.message);

      // In-memory update/insert
      const existingIdx = this.inMemoryReviews.findIndex(
        (r) => r.courseId === courseId && r.studentId === studentId
      );

      if (existingIdx >= 0) {
        this.inMemoryReviews[existingIdx] = {
          ...this.inMemoryReviews[existingIdx],
          rating: data.rating,
          reviewTitle: data.reviewTitle || '',
          reviewText: data.reviewText,
          updatedAt: now,
        };
        savedReview = this.inMemoryReviews[existingIdx];
      } else {
        savedReview = {
          id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          courseId,
          studentId,
          studentName: profile?.full_name || 'Verified Student',
          studentAvatar: profile?.avatar_url || '',
          rating: data.rating,
          reviewTitle: data.reviewTitle || '',
          reviewText: data.reviewText,
          helpfulCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        this.inMemoryReviews.push(savedReview);
      }
    }

    // Recalculate aggregates on Course & Instructor
    const allCourseReviews = (await this.getCourseReviews(courseId, 1, 1000)).reviews;
    await this.recalculateAggregates(courseId, allCourseReviews);

    return savedReview;
  }

  /**
   * Delete a review
   */
  public static async deleteReview(
    studentId: string,
    reviewId: string,
    isAdmin = false
  ): Promise<{ message: string }> {
    let courseId = '';

    try {
      const { data: rev } = await supabaseAdmin
        .from('course_reviews')
        .select('id, course_id, student_id')
        .eq('id', reviewId)
        .single();

      if (rev) {
        if (rev.student_id !== studentId && !isAdmin) {
          throw ApiError.forbidden('You are not authorized to delete this review.');
        }
        courseId = rev.course_id;
        await supabaseAdmin.from('course_reviews').delete().eq('id', reviewId);
      }
    } catch (e: any) {
      if (e instanceof ApiError) throw e;
    }

    const memIdx = this.inMemoryReviews.findIndex((r) => r.id === reviewId);
    if (memIdx >= 0) {
      const rev = this.inMemoryReviews[memIdx];
      if (rev.studentId !== studentId && !isAdmin) {
        throw ApiError.forbidden('You are not authorized to delete this review.');
      }
      courseId = rev.courseId;
      this.inMemoryReviews.splice(memIdx, 1);
    }

    if (courseId) {
      const allCourseReviews = (await this.getCourseReviews(courseId, 1, 1000)).reviews;
      await this.recalculateAggregates(courseId, allCourseReviews);
    }

    return { message: 'Review deleted successfully.' };
  }
}

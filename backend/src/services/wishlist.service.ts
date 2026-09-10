import { supabaseAdmin } from '../config/supabase';
import { courseService } from './course.service';
import { ApiError } from '../utils/apiResponse';
import { WishlistItem } from '../types';
import { logger } from '../utils/logger';

export class WishlistService {
  /**
   * Get authenticated student's wishlist
   */
  public async getStudentWishlist(studentId: string): Promise<WishlistItem[]> {
    const { data: rows, error } = await supabaseAdmin
      .from('wishlists')
      .select('*, courses(*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student wishlist:', error);
      throw ApiError.internal('Failed to retrieve wishlist');
    }

    const items: WishlistItem[] = (rows || [])
      .filter((row) => row.courses !== null && row.courses !== undefined)
      .map((row) => {
        const formattedCourse = (courseService as any).formatCourse(row.courses);
        return {
          id: row.id,
          studentId: row.student_id,
          courseId: row.course_id,
          course: formattedCourse,
          addedAt: row.created_at,
          createdAt: row.created_at,
        };
      });

    return items;
  }

  /**
   * Add a course to student's wishlist
   */
  public async addToWishlist(studentId: string, courseId: string): Promise<WishlistItem> {
    // 1. Verify course exists and is published + approved
    const { data: courseRow, error: courseErr } = await supabaseAdmin
      .from('courses')
      .select('*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name)')
      .eq('id', courseId)
      .single();

    if (courseErr || !courseRow) {
      throw ApiError.notFound('Course not found');
    }

    if (courseRow.course_status !== 'Published' || courseRow.approval_status !== 'Approved') {
      throw ApiError.badRequest('Only published and approved courses can be added to wishlist');
    }

    // 2. Insert into wishlists with ON CONFLICT DO NOTHING / UPSERT
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('wishlists')
      .upsert(
        {
          student_id: studentId,
          course_id: courseId,
        },
        { onConflict: 'student_id,course_id' }
      )
      .select('id, student_id, course_id, created_at')
      .single();

    if (insertErr || !inserted) {
      logger.error('Error adding to wishlist:', insertErr);
      throw ApiError.internal('Failed to add course to wishlist');
    }

    const formattedCourse = (courseService as any).formatCourse(courseRow);

    return {
      id: inserted.id,
      studentId: inserted.student_id,
      courseId: inserted.course_id,
      course: formattedCourse,
      addedAt: inserted.created_at,
      createdAt: inserted.created_at,
    };
  }

  /**
   * Remove a course from student's wishlist
   */
  public async removeFromWishlist(studentId: string, courseId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('wishlists')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) {
      logger.error('Error removing from wishlist:', error);
      throw ApiError.internal('Failed to remove course from wishlist');
    }
  }

  /**
   * Check if a course is in student's wishlist
   */
  public async isWishlisted(studentId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking wishlist status:', error);
      return false;
    }

    return Boolean(data);
  }
}

export const wishlistService = new WishlistService();

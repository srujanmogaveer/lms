import { supabaseAdmin } from '../config/supabase';
import { courseService } from './course.service';
import { ApiError } from '../utils/apiResponse';
import { CartItem } from '../types';
import { logger } from '../utils/logger';

export class CartService {
  /**
   * Get authenticated student's shopping cart
   */
  public async getStudentCart(studentId: string): Promise<CartItem[]> {
    const { data: rows, error } = await supabaseAdmin
      .from('cart_items')
      .select('*, courses(*, profiles:instructor_id(full_name, avatar_url), categories:category_id(name))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student cart:', error);
      throw ApiError.internal('Failed to retrieve cart items');
    }

    const items: CartItem[] = (rows || [])
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
          updatedAt: row.updated_at,
        };
      });

    return items;
  }

  /**
   * Add a course to student's cart
   */
  public async addToCart(studentId: string, courseId: string): Promise<CartItem> {
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
      throw ApiError.badRequest('Only published and approved courses can be added to the cart');
    }

    // 2. Upsert into cart_items
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('cart_items')
      .upsert(
        {
          student_id: studentId,
          course_id: courseId,
        },
        { onConflict: 'student_id,course_id' }
      )
      .select('id, student_id, course_id, created_at, updated_at')
      .single();

    if (insertErr || !inserted) {
      logger.error('Error adding to cart:', insertErr);
      throw ApiError.internal('Failed to add course to cart');
    }

    const formattedCourse = (courseService as any).formatCourse(courseRow);

    return {
      id: inserted.id,
      studentId: inserted.student_id,
      courseId: inserted.course_id,
      course: formattedCourse,
      addedAt: inserted.created_at,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    };
  }

  /**
   * Remove a course from student's cart
   */
  public async removeFromCart(studentId: string, courseId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) {
      logger.error('Error removing from cart:', error);
      throw ApiError.internal('Failed to remove course from cart');
    }
  }

  /**
   * Clear all items in student's cart
   */
  public async clearCart(studentId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('student_id', studentId);

    if (error) {
      logger.error('Error clearing cart:', error);
      throw ApiError.internal('Failed to clear cart');
    }
  }

  /**
   * Check if a course is in student's cart
   */
  public async isInCart(studentId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      logger.error('Error checking cart status:', error);
      return false;
    }

    return Boolean(data);
  }
}

export const cartService = new CartService();

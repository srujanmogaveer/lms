import { api } from './apiClient';
import type { ApiResponse } from './apiClient';
import type {
  CourseReviewItem,
  CourseRatingBreakdown,
  CourseReviewsResponse,
  SubmitReviewDto,
} from '../types';

export type {
  CourseReviewItem,
  CourseRatingBreakdown,
  CourseReviewsResponse,
  SubmitReviewDto,
};

export const reviewService = {
  /**
   * Fetch paginated reviews and summary rating breakdown for a course
   */
  getCourseReviews: async (
    courseId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
    }
  ): Promise<CourseReviewsResponse> => {
    const res: ApiResponse<CourseReviewsResponse> = await api.get(
      `/courses/${courseId}/reviews`,
      params
    );
    return (
      res.data || {
        reviews: [],
        summary: {
          averageRating: 5.0,
          totalReviews: 0,
          distribution: {
            5: { count: 0, percentage: 0 },
            4: { count: 0, percentage: 0 },
            3: { count: 0, percentage: 0 },
            2: { count: 0, percentage: 0 },
            1: { count: 0, percentage: 0 },
          },
        },
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      }
    );
  },

  /**
   * Fetch current authenticated student's review for a course
   */
  getMyReview: async (courseId: string): Promise<CourseReviewItem | null> => {
    try {
      const res: ApiResponse<CourseReviewItem> = await api.get(
        `/courses/${courseId}/reviews/my-review`
      );
      return res.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Submit or update a review (Upsert)
   */
  submitReview: async (
    courseId: string,
    data: SubmitReviewDto
  ): Promise<CourseReviewItem> => {
    const res: ApiResponse<CourseReviewItem> = await api.post(
      `/courses/${courseId}/reviews`,
      data
    );
    if (!res.data) throw new Error(res.message || 'Failed to submit review');
    return res.data;
  },

  /**
   * Delete a review
   */
  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  },
};

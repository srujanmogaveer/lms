import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { sendResponse, ApiError } from '../utils/apiResponse';

export class ReviewController {
  /**
   * GET /api/v1/courses/:courseId/reviews
   * Public: List course reviews and rating breakdown
   */
  public async getCourseReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.courseId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const sortBy = (req.query.sortBy as any) || 'newest';

      const result = await ReviewService.getCourseReviews(courseId, page, limit, rating, sortBy);
      sendResponse(res, 200, 'Course reviews retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/courses/:courseId/reviews/my-review
   * Auth: Student's personal review
   */
  public async getMyReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const courseId = req.params.courseId as string;
      const review = await ReviewService.getStudentCourseReview(studentId, courseId);
      sendResponse(res, 200, 'Personal course review retrieved', review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/courses/:courseId/reviews
   * Auth: Submit or update review (Upsert)
   */
  public async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const courseId = req.params.courseId as string;
      const { rating, reviewTitle, reviewText } = req.body;

      const review = await ReviewService.upsertReview(studentId, courseId, {
        rating,
        reviewTitle,
        reviewText,
      });

      sendResponse(res, 201, 'Review submitted successfully', review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/reviews/:reviewId
   * Auth: Delete review
   */
  public async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw ApiError.unauthorized('Authentication required');

      const reviewId = req.params.reviewId as string;
      const isAdmin = req.user?.role === 'admin';

      const result = await ReviewService.deleteReview(studentId, reviewId, isAdmin);
      sendResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();

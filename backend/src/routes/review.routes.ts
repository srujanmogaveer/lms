import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createReviewSchema,
  listReviewsSchema,
} from '../validators/review.validator';

const router = Router({ mergeParams: true });

// GET /api/v1/courses/:courseId/reviews (Public list + summary breakdown)
router.get(
  '/:courseId/reviews',
  validateRequest(listReviewsSchema),
  (req, res, next) => reviewController.getCourseReviews(req, res, next)
);

// GET /api/v1/courses/:courseId/reviews/my-review (Auth: Student)
router.get(
  '/:courseId/reviews/my-review',
  authenticateUser,
  (req, res, next) => reviewController.getMyReview(req, res, next)
);

// POST /api/v1/courses/:courseId/reviews (Auth: Student submit/update review)
router.post(
  '/:courseId/reviews',
  authenticateUser,
  validateRequest(createReviewSchema),
  (req, res, next) => reviewController.submitReview(req, res, next)
);

// DELETE /api/v1/reviews/:reviewId (Auth: Delete review)
router.delete(
  '/reviews/:reviewId',
  authenticateUser,
  (req, res, next) => reviewController.deleteReview(req, res, next)
);

export default router;

import { z } from 'zod';

export const createReviewSchema = {
  params: z.object({
    courseId: z.string().uuid('Invalid Course ID format'),
  }),
  body: z.object({
    rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    reviewTitle: z.string().max(120, 'Title cannot exceed 120 characters').optional().default(''),
    reviewText: z.string().min(5, 'Review comment must be at least 5 characters').max(2000, 'Review comment cannot exceed 2000 characters'),
  }),
};

export const updateReviewSchema = {
  params: z.object({
    reviewId: z.string().uuid('Invalid Review ID format'),
  }),
  body: z.object({
    rating: z.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').optional(),
    reviewTitle: z.string().max(120).optional(),
    reviewText: z.string().min(5).max(2000).optional(),
  }),
};

export const listReviewsSchema = {
  params: z.object({
    courseId: z.string().uuid('Invalid Course ID format'),
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(10),
    rating: z.coerce.number().min(1).max(5).optional(),
    sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest']).optional().default('newest'),
  }),
};

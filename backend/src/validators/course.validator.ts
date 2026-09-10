import { z } from 'zod';

const difficultyEnum = z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']);
const languageEnum = z.enum(['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi']);
const courseStatusEnum = z.enum(['Draft', 'Published', 'Archived']);
const approvalStatusEnum = z.enum(['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Archived']);

export const createCourseSchema = {
  body: z.object({
    title: z.string().min(3, 'Course Title must be at least 3 characters'),
    shortDescription: z.string().optional().default(''),
    fullDescription: z.string().optional().default(''),
    categoryId: z.string().uuid().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    difficulty: difficultyEnum.optional().default('Beginner'),
    language: languageEnum.optional().default('English'),
    thumbnail: z.string().min(1, 'Course Thumbnail is required'),
    promoVideoUrl: z.string().optional().default(''),
    price: z.number().nonnegative('Price must be greater than or equal to 0').default(0),
    discountPrice: z.number().nonnegative('Discount price cannot be negative').optional(),
    tags: z.array(z.string()).optional().default([]),
    requirements: z.array(z.string()).optional().default([]),
    learningOutcomes: z.array(z.string()).optional().default([]),
    isSubmitForApproval: z.boolean().optional().default(false),
  }),
};

export const updateCourseSchema = {
  body: z.object({
    title: z.string().min(3).optional(),
    shortDescription: z.string().optional(),
    fullDescription: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    difficulty: difficultyEnum.optional(),
    language: languageEnum.optional(),
    thumbnail: z.string().min(1).optional(),
    promoVideoUrl: z.string().optional(),
    price: z.number().nonnegative().optional(),
    discountPrice: z.number().nonnegative().optional(),
    tags: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    learningOutcomes: z.array(z.string()).optional(),
    isSubmitForApproval: z.boolean().optional(),
  }),
};

export const rejectCourseSchema = {
  body: z.object({
    rejectionReason: z.string().min(5, 'Rejection reason must be provided (at least 5 characters)'),
  }),
};

export const courseQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    difficulty: z.string().optional(),
    language: z.string().optional(),
    priceType: z.enum(['all', 'free', 'paid', 'featured']).optional(),
    courseStatus: courseStatusEnum.optional(),
    approvalStatus: approvalStatusEnum.optional(),
    instructorId: z.string().uuid().optional(),
    minRating: z.coerce.number().optional(),
    sortBy: z.enum(['newest', 'oldest', 'alphabetical', 'students', 'rating', 'popular']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
};

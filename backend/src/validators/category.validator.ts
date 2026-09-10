import { z } from 'zod';

export const subcategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Subcategory name is required'),
  slug: z.string().optional(),
  description: z.string().optional().default(''),
  coursesCount: z.number().int().nonnegative().optional().default(0),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(2, 'Category Name must be at least 2 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    imageUrl: z.string().min(1).optional().default('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'),
    status: z.enum(['Active', 'Inactive']).optional().default('Active'),
    subcategories: z.array(z.union([z.string(), subcategorySchema])).optional().default([]),
  }),
};

export const updateCategorySchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    imageUrl: z.string().min(1).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
    subcategories: z.array(z.union([z.string(), subcategorySchema])).optional(),
  }),
};

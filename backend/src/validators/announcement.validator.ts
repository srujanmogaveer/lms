import { z } from 'zod';

export const createAnnouncementBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  message: z.string().min(1, 'Message content is required'),
  audience: z.enum([
    'Students',
    'Instructors',
    'Both Students & Instructors',
    'Specific Course Students'
  ]).optional(),
  courseId: z.string().uuid().optional().nullable(),
  status: z.enum(['Draft', 'Published']).optional().default('Draft'),
});

export const updateAnnouncementBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  message: z.string().min(1).optional(),
  audience: z.enum([
    'Students',
    'Instructors',
    'Both Students & Instructors',
    'Specific Course Students'
  ]).optional(),
  courseId: z.string().uuid().optional().nullable(),
  status: z.enum(['Draft', 'Published']).optional(),
});

export const announcementParamsSchema = z.object({
  id: z.string().min(1, 'Announcement ID is required'),
});

import { z } from 'zod';

export const createModuleSchema = z.object({
  title: z
    .string({ required_error: 'Module title is required' })
    .min(2, 'Module title must be at least 2 characters')
    .max(200, 'Module title must not exceed 200 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  position: z.number().int().min(1, 'Position must be a positive integer').optional(),
});

export const updateModuleSchema = z.object({
  title: z
    .string()
    .min(2, 'Module title must be at least 2 characters')
    .max(200, 'Module title must not exceed 200 characters')
    .optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  position: z.number().int().min(1, 'Position must be a positive integer').optional(),
});

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string({ required_error: 'ID is required' }).uuid('Invalid UUID format'),
      position: z.number().int().min(1, 'Position must be at least 1'),
    })
  ).min(1, 'At least one item is required to reorder'),
});

const lessonTypeEnum = z.enum(['Video', 'PDF', 'Text', 'Resource'], {
  errorMap: () => ({ message: 'Lesson type must be one of: Video, PDF, Text, Resource' }),
});

export const createLessonSchema = z.object({
  title: z
    .string({ required_error: 'Lesson title is required' })
    .min(2, 'Lesson title must be at least 2 characters')
    .max(255, 'Lesson title cannot exceed 255 characters'),
  shortDescription: z.string().max(2000, 'Short description cannot exceed 2000 characters').optional().nullable(),
  lessonType: lessonTypeEnum,
  content: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable().or(z.literal('')),
  documentUrl: z.string().optional().nullable().or(z.literal('')),
  resourceUrl: z.string().optional().nullable().or(z.literal('')),
  durationMinutes: z.number().int().min(0, 'Duration cannot be negative').optional().default(0),
  position: z.number().int().min(1, 'Position must be at least 1').optional(),
  isPreview: z.boolean().optional().default(false),
});

export const updateLessonSchema = z.object({
  title: z
    .string()
    .min(2, 'Lesson title must be at least 2 characters')
    .max(255, 'Lesson title cannot exceed 255 characters')
    .optional(),
  shortDescription: z.string().max(2000, 'Short description cannot exceed 2000 characters').optional().nullable(),
  lessonType: lessonTypeEnum.optional(),
  content: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable().or(z.literal('')),
  documentUrl: z.string().optional().nullable().or(z.literal('')),
  resourceUrl: z.string().optional().nullable().or(z.literal('')),
  durationMinutes: z.number().int().min(0, 'Duration cannot be negative').optional(),
  position: z.number().int().min(1, 'Position must be at least 1').optional(),
  isPreview: z.boolean().optional(),
});

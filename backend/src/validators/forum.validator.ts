import { z } from 'zod';

const attachmentSchema = z.object({
  name: z.string().min(1),
  size: z.string().min(1),
  type: z.enum(['image', 'code', 'pdf', 'zip', 'doc', 'other']),
  url: z.string().min(1),
});

export const createDiscussionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  category: z.enum([
    'General Discussion',
    'Assignments',
    'Quizzes',
    'Course Content',
    'Technical Issues',
    'Announcements',
  ]),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title cannot exceed 255 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  attachments: z.array(attachmentSchema).optional(),
});

export const updateDiscussionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  category: z
    .enum([
      'General Discussion',
      'Assignments',
      'Quizzes',
      'Course Content',
      'Technical Issues',
      'Announcements',
    ])
    .optional(),
});

export const createReplySchema = z.object({
  content: z.string().min(1, 'Reply message cannot be empty'),
  attachments: z.array(attachmentSchema).optional(),
});

export const updateReplySchema = z.object({
  content: z.string().min(1, 'Reply message cannot be empty'),
});

export const toggleReactionSchema = z.object({
  targetType: z.enum(['discussion', 'reply']),
  targetId: z.string().min(1, 'Target ID is required'),
});

export const moderateDiscussionSchema = z.object({
  isPinned: z.boolean().optional(),
  isSolved: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export const moderateReplySchema = z.object({
  isPinned: z.boolean().optional(),
  isAcceptedAnswer: z.boolean().optional(),
});

export const createReportSchema = z.object({
  targetType: z.enum(['discussion', 'reply']),
  targetId: z.string().min(1, 'Target ID is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export const resolveReportSchema = z.object({
  status: z.enum(['Reviewed', 'Dismissed', 'Actioned']),
  resolutionNotes: z.string().optional(),
});

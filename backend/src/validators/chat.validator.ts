import { z } from 'zod';

export const createConversationSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required').optional(),
  courseId: z.string().uuid('Valid course UUID is required').optional(),
  type: z.enum(['student_instructor', 'admin_instructor']).optional(),
});

export const sendMessageSchema = z
  .object({
    content: z.string().max(2000, 'Message cannot exceed 2000 characters').default(''),
    type: z.enum(['text', 'image', 'file', 'link']).default('text'),
    attachments: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1, 'Attachment name is required'),
          size: z.string().min(1, 'Attachment size is required'),
          type: z.enum(['image', 'pdf', 'doc', 'archive', 'file', 'other']),
          url: z.string().min(1, 'Attachment URL is required'),
          previewUrl: z.string().optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => data.content.trim().length > 0 || (data.attachments && data.attachments.length > 0),
    {
      message: 'Message must contain either text content or an attachment.',
      path: ['content'],
    }
  );

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  before: z.string().optional(),
});

import { z } from 'zod';

export const createContactInquirySchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  category: z.enum(['General', 'Courses', 'Technical', 'Billing']).default('General'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const updateContactInquiryStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved', 'closed']),
  adminNotes: z.string().optional(),
});

export const contactInquiryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['all', 'new', 'in_progress', 'resolved', 'closed']).default('all'),
  category: z.string().optional(),
  search: z.string().optional(),
});

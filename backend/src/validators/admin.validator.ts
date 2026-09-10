import { z } from 'zod';

export const userQuerySchema = z.object({
  role: z.enum(['student', 'instructor', 'admin']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_approval']).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'pending_approval']),
});

export const rejectInstructorSchema = z.object({
  rejectionReason: z.string().optional(),
});

export const createInstructorSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  qualification: z.string().min(1, 'Qualification is required'),
  experience: z.string().min(1, 'Experience is required'),
  specialization: z.string().optional(),
  bio: z.string().optional(),
});

export const updateInstructorSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_approval']).optional(),
});

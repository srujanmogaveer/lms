import { z } from 'zod';

export const createAssignmentSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().min(3, 'Description is required and must be at least 3 characters'),
    instructions: z.string().trim().min(3, 'Instructions are required and must be at least 3 characters'),
    moduleId: z.string().uuid('Invalid module ID format').optional().nullable(),
    lessonId: z.string().uuid('Invalid lesson ID format').optional().nullable(),
    dueDays: z.number().int().min(0, 'Due days must be at least 0').optional().default(7),
    maxScore: z.number().positive('Maximum score must be greater than 0').default(100),
    passingScore: z.number().min(0, 'Passing score must be at least 0').optional().default(60),
    maxAttempts: z.number().int('Maximum attempts must be an integer').min(1, 'Maximum attempts must be at least 1').optional().default(3),
    status: z.enum(['Draft', 'Published', 'Archived']).optional().default('Published'),
    position: z.number().int().min(1).optional().default(1),
  }).refine((data) => {
    if (data.passingScore !== undefined && data.maxScore !== undefined) {
      return data.passingScore <= data.maxScore;
    }
    return true;
  }, {
    message: 'Passing score must be less than or equal to maximum score',
    path: ['passingScore'],
  }),
};

export const updateAssignmentSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    moduleId: z.string().uuid('Invalid module ID format').optional().nullable(),
    lessonId: z.string().uuid('Invalid lesson ID format').optional().nullable(),
    dueDays: z.number().int().min(0, 'Due days must be at least 0').optional(),
    maxScore: z.number().positive('Maximum score must be greater than 0').optional(),
    passingScore: z.number().min(0, 'Passing score must be at least 0').optional(),
    maxAttempts: z.number().int('Maximum attempts must be an integer').min(1, 'Maximum attempts must be at least 1').optional(),
    status: z.enum(['Draft', 'Published', 'Archived']).optional(),
    position: z.number().int().min(1).optional(),
  }).refine((data) => {
    if (data.passingScore !== undefined && data.maxScore !== undefined) {
      return data.passingScore <= data.maxScore;
    }
    return true;
  }, {
    message: 'Passing score must be less than or equal to maximum score',
    path: ['passingScore'],
  }),
};

export const reorderAssignmentsSchema = {
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().uuid('Invalid assignment ID format'),
        position: z.number().int().min(1, 'Position must be at least 1'),
      })
    ).min(1, 'At least one item is required for reordering'),
  }),
};

export const createSubmissionSchema = {
  body: z.object({
    submissionText: z.string().optional(),
    fileUrl: z.string().optional(),
  }).refine((data) => {
    return Boolean(data.submissionText?.trim() || data.fileUrl?.trim());
  }, {
    message: 'Please provide either a text submission or an uploaded file',
  }),
};

export const gradeSubmissionSchema = {
  body: z.object({
    score: z.number().min(0, 'Score must be at least 0'),
    feedback: z.string().optional().default(''),
    status: z.enum(['Submitted', 'Under Review', 'Graded', 'Resubmission Requested']).optional().default('Graded'),
  }),
};

export const createAssignmentReattemptRequestSchema = {
  body: z.object({
    reason: z.string().trim().min(3, 'Please provide a clear reason for requesting another attempt (at least 3 characters)').max(1000, 'Reason cannot exceed 1000 characters'),
  }),
};

export const reviewAssignmentReattemptRequestSchema = {
  body: z.object({
    status: z.enum(['Approved', 'Rejected'], {
      errorMap: () => ({ message: 'Status must be either Approved or Rejected' }),
    }),
    feedback: z.string().trim().max(1000, 'Feedback cannot exceed 1000 characters').optional(),
  }),
};


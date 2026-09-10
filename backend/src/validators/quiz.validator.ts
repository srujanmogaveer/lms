import { z } from 'zod';
import { RequestValidationSchema } from '../middleware/validate.middleware';

export const createQuizSchema: RequestValidationSchema = {
  params: z.object({
    courseId: z.string().uuid({ message: 'Valid course UUID is required' }),
  }),
  body: z.object({
    title: z.string().min(1, { message: 'Quiz title is required' }).max(255),
    description: z.string().optional(),
    instructions: z.string().optional(),
    moduleId: z.string().uuid().optional().nullable(),
    lessonId: z.string().uuid().optional().nullable(),
    timeLimitMinutes: z.number().int().min(0).default(15),
    passingScore: z.number().min(0).max(100).default(70),
    quizType: z.enum(['Mandatory', 'Optional']).default('Mandatory'),
    maxAttempts: z.number().int().min(1).default(3),
    randomizeQuestions: z.boolean().default(true),
    shuffleOptions: z.boolean().default(true),
    status: z.enum(['Draft', 'Published', 'Archived']).default('Draft'),
    position: z.number().int().min(1).default(1),
  }),
};

export const updateQuizSchema: RequestValidationSchema = {
  params: z.object({
    quizId: z.string().uuid({ message: 'Valid quiz UUID is required' }),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    instructions: z.string().optional().nullable(),
    moduleId: z.string().uuid().optional().nullable(),
    lessonId: z.string().uuid().optional().nullable(),
    timeLimitMinutes: z.number().int().min(0).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    quizType: z.enum(['Mandatory', 'Optional']).optional(),
    maxAttempts: z.number().int().min(1).optional(),
    randomizeQuestions: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    status: z.enum(['Draft', 'Published', 'Archived']).optional(),
    position: z.number().int().min(1).optional(),
  }),
};

export const reorderQuizzesSchema: RequestValidationSchema = {
  params: z.object({
    courseId: z.string().uuid({ message: 'Valid course UUID is required' }),
  }),
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int().min(1),
      })
    ).min(1, { message: 'Items array is required for reordering' }),
  }),
};

export const createQuestionSchema: RequestValidationSchema = {
  params: z.object({
    quizId: z.string().uuid({ message: 'Valid quiz UUID is required' }),
  }),
  body: z.object({
    questionText: z.string().min(1, { message: 'Question text is required' }),
    questionType: z.enum([
      'Single Answer',
      'Multiple Answer',
      'Fill in the Blanks',
      'True or False',
    ]),
    options: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean().optional(),
      })
    ).default([]),
    correctAnswer: z.any().optional(),
    points: z.number().min(0.1, { message: 'Points must be greater than 0' }).default(10),
    explanation: z.string().optional(),
    position: z.number().int().min(1).default(1),
  }),
};

export const updateQuestionSchema: RequestValidationSchema = {
  params: z.object({
    questionId: z.string().uuid({ message: 'Valid question UUID is required' }),
  }),
  body: z.object({
    questionText: z.string().min(1).optional(),
    questionType: z.enum([
      'Single Answer',
      'Multiple Answer',
      'Fill in the Blanks',
      'True or False',
    ]).optional(),
    options: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        isCorrect: z.boolean().optional(),
      })
    ).optional(),
    correctAnswer: z.any().optional(),
    points: z.number().min(0.1).optional(),
    explanation: z.string().optional().nullable(),
    position: z.number().int().min(1).optional(),
  }),
};

export const reorderQuestionsSchema: RequestValidationSchema = {
  params: z.object({
    quizId: z.string().uuid({ message: 'Valid quiz UUID is required' }),
  }),
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int().min(1),
      })
    ).min(1, { message: 'Items array is required for reordering' }),
  }),
};

export const submitAttemptSchema: RequestValidationSchema = {
  params: z.object({
    attemptId: z.string().uuid({ message: 'Valid attempt UUID is required' }),
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().uuid(),
        answer: z.any(),
      })
    ).default([]),
  }),
};

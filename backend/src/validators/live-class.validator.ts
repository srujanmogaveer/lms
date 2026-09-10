import { z } from 'zod';

export const createLiveClassSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    courseId: z.string().min(1, 'Course ID is required'),
    description: z.string().optional().default(''),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    durationMinutes: z.number().int().positive('Duration must be positive').optional(),
    platform: z.string().optional().default('Google Meet'),
    meetingUrl: z.string().trim().optional(),
    meetingId: z.string().optional(),
    passcode: z.string().optional(),
    status: z.enum(['Draft', 'Scheduled', 'Live', 'Completed', 'Cancelled']).optional().default('Scheduled'),
    audienceType: z.enum(['All Enrolled Students', 'Selected Students']).optional().default('All Enrolled Students'),
    selectedStudentIds: z.array(z.string()).optional().default([]),
    instructions: z.string().optional().default(''),
    resources: z.array(z.any()).optional().default([]),
    recordingUrl: z.string().trim().url('Recording URL must be a valid URL').optional().or(z.literal('')),
  }).refine((data) => {
    const isJitsi = data.platform === 'Jitsi Meet';
    if (!isJitsi) {
      if (!data.meetingUrl || !data.meetingUrl.trim()) {
        return false;
      }
      try {
        new URL(data.meetingUrl);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, {
    message: 'Meeting URL is required and must be a valid URL for external platforms',
    path: ['meetingUrl'],
  }).refine((data) => {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      return end > start;
    }
    return true;
  }, {
    message: 'End time must be after start time',
    path: ['endTime'],
  }).refine((data) => {
    if (data.audienceType === 'Selected Students') {
      return Array.isArray(data.selectedStudentIds) && data.selectedStudentIds.length > 0;
    }
    return true;
  }, {
    message: 'At least one student must be selected for a private live class',
    path: ['selectedStudentIds'],
  }).refine((data) => {
    if (data.audienceType === 'All Enrolled Students') {
      return !data.selectedStudentIds || data.selectedStudentIds.length === 0;
    }
    return true;
  }, {
    message: 'Selected student IDs must be empty when audience is All Enrolled Students',
    path: ['selectedStudentIds'],
  }),
};

export const updateLiveClassSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
    courseId: z.string().min(1).optional(),
    description: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    durationMinutes: z.number().int().positive().optional(),
    platform: z.string().optional(),
    meetingUrl: z.string().trim().optional(),
    meetingId: z.string().optional(),
    passcode: z.string().optional(),
    status: z.enum(['Draft', 'Scheduled', 'Live', 'Completed', 'Cancelled']).optional(),
    audienceType: z.enum(['All Enrolled Students', 'Selected Students']).optional(),
    selectedStudentIds: z.array(z.string()).optional(),
    instructions: z.string().optional(),
    resources: z.array(z.any()).optional(),
    recordingUrl: z.string().trim().url('Recording URL must be a valid URL').optional().or(z.literal('')),
    isRecordingAvailable: z.boolean().optional(),
  }).refine((data) => {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        return end > start;
      }
    }
    return true;
  }, {
    message: 'End time must be after start time',
    path: ['endTime'],
  }),
};

export const rescheduleLiveClassSchema = {
  body: z.object({
    startTime: z.string().min(1, 'New start time is required'),
    endTime: z.string().min(1, 'New end time is required'),
    durationMinutes: z.number().int().positive().optional(),
  }).refine((data) => {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      return end > start;
    }
    return true;
  }, {
    message: 'End time must be after start time',
    path: ['endTime'],
  }),
};

export const askQuestionSchema = {
  body: z.object({
    questionText: z.string().trim().min(2, 'Question must be at least 2 characters').max(1000, 'Question too long'),
  }),
};

export const replyQuestionSchema = {
  body: z.object({
    instructorReply: z.string().trim().min(1, 'Reply cannot be empty').max(2000, 'Reply too long'),
  }),
};

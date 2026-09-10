import { z } from 'zod';

export const updatePlatformSettingsSchema = {
  body: z.object({
    platformName: z.string().min(2, 'Platform Name must be at least 2 characters').max(100).optional(),
    supportEmail: z.string().email('Invalid support email address').optional(),
    supportPhone: z
      .string()
      .regex(/^\d{10}$/, 'Support phone must be exactly 10 digits (numbers only)')
      .optional(),
    enableStudentRegistration: z.boolean().optional(),
    enableInstructorRegistration: z.boolean().optional(),
    platformCommissionPercent: z.number().min(0, 'Commission cannot be negative').max(100, 'Commission cannot exceed 100%').optional(),
    enableMaintenanceMode: z.boolean().optional(),
    maintenanceMessage: z.string().max(500, 'Maintenance message too long').optional(),
  }),
};

import { z } from 'zod';

export const studentRegisterSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full Name is required and must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(10, 'Please enter a valid phone number').optional(),
    termsAgreed: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms & Privacy Policy',
    }),
  }),
};

export const instructorRegisterSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full Name is required and must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z
      .string()
      .refine((val) => !val || /^\d{10}$/.test(val.trim()), {
        message: 'Mobile number must be exactly 10 digits',
      })
      .nullable()
      .optional(),
    avatarUrl: z.string().nullable().optional(),
    qualification: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    specialization: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    termsAgreed: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Instructor Terms & Guidelines',
    }),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    role: z.enum(['student', 'instructor', 'admin']).optional(),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
};

export const updateProfileSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters').optional(),
    phone: z
      .string()
      .refine((val) => !val || /^\d{10}$/.test(val.trim()), {
        message: 'Mobile number must be exactly 10 digits',
      })
      .optional(),
    bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional(),
    headline: z.string().max(200).optional(),
    avatarUrl: z.string().optional(),
    qualification: z.string().optional(),
    experience: z.string().optional(),
    dateOfBirth: z
      .string()
      .refine(
        (val) => {
          if (!val) return true;
          const dob = new Date(val);
          if (isNaN(dob.getTime())) return false;
          const today = new Date();
          // Normalize to YYYY-MM-DD for strict date-only comparison in UTC/local
          const dobStr = val.split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          return dobStr <= todayStr;
        },
        {
          message: 'Date of Birth cannot be in the future. Please select today or a past date.',
        }
      )
      .optional(),
    gender: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().optional(),
    linkedInUrl: z.string().optional(),
    personalWebsite: z.string().optional(),
    themePreference: z.enum(['light', 'dark', 'system', 'Light', 'Dark', 'System']).optional(),
    languagePreference: z.string().optional(),
    payoutInfo: z.any().optional(),
    notificationPreferences: z.any().optional(),
    privacySettings: z.any().optional(),
  }),
};

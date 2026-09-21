import { z } from 'zod';

export const recordPayoutSchema = z.object({
  instructorId: z.string().uuid('Invalid Instructor ID'),
  amount: z.number().positive('Payout amount must be greater than 0'),
  payoutMethod: z.string().default('Bank Transfer'),
  transactionId: z.string().min(3, 'Transaction ID / UTR Number is required'),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordPayoutDto = z.infer<typeof recordPayoutSchema>;

export const autoDisbursePayoutSchema = z.object({
  instructorId: z.string().uuid('Invalid Instructor ID'),
  amount: z.number().positive('Payout amount must be greater than 0'),
  notes: z.string().optional(),
  preferredMethod: z.enum(['auto', 'Bank Account', 'UPI ID']).optional().default('auto'),
});

export type AutoDisbursePayoutDto = z.infer<typeof autoDisbursePayoutSchema>;

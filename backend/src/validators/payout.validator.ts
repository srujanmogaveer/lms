import { z } from 'zod';

export const recordPayoutSchema = z.object({
  instructorId: z.string().uuid('Invalid Instructor ID'),
  amount: z.number().positive('Payout amount must be greater than 0'),
  payoutMethod: z.enum(['Bank Transfer', 'UPI', 'Bank Account', 'UPI ID']).default('Bank Transfer'),
  transactionId: z.string().min(3, 'Transaction ID / UTR Number is required'),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordPayoutDto = z.infer<typeof recordPayoutSchema>;

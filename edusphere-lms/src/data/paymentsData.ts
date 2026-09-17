export type PaymentStatusType = 'Paid' | 'Failed' | 'Cancelled';
export type PayoutStatusType = 'Pending' | 'Settled' | 'No Dues' | 'Processing';
export type PaymentMethodType = 'UPI (GPay / PhonePe)' | 'Razorpay' | 'NetBanking' | 'Credit Card' | 'Debit Card';
export type PayoutMethodType = 'Bank Account' | 'UPI ID';

export interface StudentPaymentRecord {
  id: string;
  transactionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  paymentMethod: PaymentMethodType;
  amountINR: number;
  purchaseDate: string; // DD/MM/YYYY
  paymentStatus: PaymentStatusType;
}

export interface RevenueSummaryData {
  totalRevenueINR: number;
  platformEarningsINR: number;
  instructorEarningsINR: number;
  totalTransactionsCount: number;
  todayRevenueINR: number;
  weeklyRevenueINR: number;
  monthlyRevenueINR: number;
  yearlyRevenueINR: number;
}

export interface InstructorEarningRecord {
  instructorId: string;
  instructorName: string;
  avatar: string;
  totalCourses: number;
  totalStudents: number;
  totalRevenueINR: number;
  platformCommissionINR: number; // 15%
  instructorEarningsINR: number; // 85%
}

export interface InstructorPayoutRecord {
  id: string;
  instructorId: string;
  instructorName: string;
  avatar: string;
  payoutMethod: PayoutMethodType;
  accountDetails: string; // e.g. "HDFC Bank A/C: ****5821 (IFSC: HDFC0001234)" or "vikram.seth@okaxis"
  amountPayableINR: number;
  lastPaymentDate: string;
  payoutStatus: PayoutStatusType;
  hasValidPayoutDetails?: boolean;
  utrNumber?: string;
  notes?: string;
}

export interface PaymentHistoryRecord {
  id: string;
  payoutId: string;
  instructorName: string;
  amountINR: number;
  paymentMethod: string;
  transactionId: string; // UTR or Ref number
  paymentDate: string; // DD/MM/YYYY
  notes?: string;
}


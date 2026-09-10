export type PayoutMethodType = 'Bank Account' | 'UPI ID';
export type PaymentExecutionMethod = 'Bank Transfer' | 'UPI';

export interface BankAccountDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'Savings' | 'Current';
}

export interface UPIDetails {
  upiId: string;
  upiAccountName: string;
}

export interface InstructorPayoutInfo {
  selectedMethod: PayoutMethodType;
  bankDetails: BankAccountDetails;
  upiDetails: UPIDetails;
  lastUpdated?: string;
}

export interface PaymentRecord {
  id: string;
  instructorId: string;
  instructorName: string;
  amount: number; // INR
  paymentMethod: PaymentExecutionMethod;
  transactionId: string; // UTR or Ref number
  paymentDate: string; // YYYY-MM-DD or formatted string
  notes?: string;
  status: 'Paid';
}

export interface InstructorPayoutSummary {
  instructorId: string;
  instructorName: string;
  email: string;
  photoUrl?: string;
  payoutInfo: InstructorPayoutInfo;
  totalRevenue: number;
  platformCommissionRate: number; // e.g. 0.15 (15%)
  platformCommission: number;
  instructorEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Processing';
  paymentHistory: PaymentRecord[];
}

import type {
  InstructorPayoutSummary,
  InstructorPayoutInfo,
  PaymentRecord,
} from '../types/payoutTypes';

const INITIAL_INSTRUCTOR_PAYOUTS: Record<string, InstructorPayoutSummary> = {
  'INS-2026-8492': {
    instructorId: 'INS-2026-8492',
    instructorName: 'Dr. Marcus Vance',
    email: 'marcus.vance@edusphere.edu',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    payoutInfo: {
      selectedMethod: 'Bank Account',
      bankDetails: {
        accountHolderName: 'Dr. Marcus Vance',
        bankName: 'HDFC Bank',
        accountNumber: '50100492819283',
        ifscCode: 'HDFC0000240',
        accountType: 'Savings',
      },
      upiDetails: {
        upiId: 'marcus.vance@okhdfcbank',
        upiAccountName: 'Dr. Marcus Vance',
      },
      lastUpdated: '12/08/2026',
    },
    totalRevenue: 284500,
    platformCommissionRate: 0.15,
    platformCommission: 42675,
    instructorEarnings: 241825,
    paidAmount: 180000,
    pendingAmount: 61825,
    paymentStatus: 'Pending',
    paymentHistory: [
      {
        id: 'PAY-2026-001',
        instructorId: 'INS-2026-8492',
        instructorName: 'Dr. Marcus Vance',
        amount: 100000,
        paymentMethod: 'Bank Transfer',
        transactionId: 'UTR982374829104',
        paymentDate: '15/06/2026',
        notes: 'Monthly payout settlement for May 2026',
        status: 'Paid',
      },
      {
        id: 'PAY-2026-002',
        instructorId: 'INS-2026-8492',
        instructorName: 'Dr. Marcus Vance',
        amount: 80000,
        paymentMethod: 'Bank Transfer',
        transactionId: 'UTR109283746192',
        paymentDate: '15/07/2026',
        notes: 'Monthly payout settlement for June 2026',
        status: 'Paid',
      },
    ],
  },
};

type Listener = () => void;

class PayoutStore {
  private data: Record<string, InstructorPayoutSummary>;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.data = { ...INITIAL_INSTRUCTOR_PAYOUTS };
  }

  public getSummary(instructorId: string): InstructorPayoutSummary | undefined {
    return this.data[instructorId] || this.data['INS-2026-8492'];
  }

  public getAllSummaries(): InstructorPayoutSummary[] {
    return Object.values(this.data);
  }

  public updatePayoutInfo(instructorId: string, info: InstructorPayoutInfo) {
    if (this.data[instructorId]) {
      this.data[instructorId].payoutInfo = info;
      this.notify();
    }
  }

  public recordPayment(record: Omit<PaymentRecord, 'id' | 'status' | 'instructorName'> & { instructorId: string; instructorName?: string }) {
    const summary = this.data[record.instructorId] || this.data['INS-2026-8492'];
    if (!summary) return;

    const newPayment: PaymentRecord = {
      ...record,
      instructorName: record.instructorName || summary.instructorName,
      id: `PAY-2026-${String(summary.paymentHistory.length + 1).padStart(3, '0')}`,
      status: 'Paid',
    };

    summary.paymentHistory = [newPayment, ...summary.paymentHistory];
    summary.paidAmount += record.amount;
    summary.pendingAmount = Math.max(0, summary.instructorEarnings - summary.paidAmount);
    summary.paymentStatus = summary.pendingAmount === 0 ? 'Paid' : 'Pending';

    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in payoutStore listener', err);
      }
    });
  }
}

export const payoutStore = new PayoutStore();

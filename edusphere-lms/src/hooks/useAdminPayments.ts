import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { adminService } from '../services/adminService';
import type {
  StudentPaymentRecord,
  InstructorEarningRecord,
  InstructorPayoutRecord,
  PaymentHistoryRecord,
  PayoutStatusType,
} from '../data/paymentsData';

export interface AdminPaymentsData {
  summary: {
    totalPaidAmount: number;
    successfulPaymentsCount: number;
    pendingPaymentsCount: number;
    failedPaymentsCount: number;
    totalTransactionsCount: number;
    todayRevenueINR: number;
    weeklyRevenueINR: number;
    monthlyRevenueINR: number;
    yearlyRevenueINR: number;
    platformEarningsINR: number;
    instructorEarningsINR: number;
  };
  studentPayments: StudentPaymentRecord[];
  instructorEarnings: InstructorEarningRecord[];
  payouts: InstructorPayoutRecord[];
  history: PaymentHistoryRecord[];
}

export const ADMIN_PAYMENTS_QUERY_KEY = ['admin', 'payments-data'] as const;

export async function fetchAdminPaymentsData(): Promise<AdminPaymentsData> {
  const [paymentsRes, payoutsRes] = await Promise.all([
    paymentService.getAdminPayments(),
    adminService.getAllInstructorPayouts().catch(() => ({ success: false, data: [] })),
  ]);

  if (!paymentsRes.success || !paymentsRes.data) {
    throw new Error(paymentsRes.message || 'Failed to load payment records from server.');
  }

  const apiPayments = paymentsRes.data.payments || [];
  const rawSummary = paymentsRes.data.summary || {
    totalPaidAmount: 0,
    successfulPaymentsCount: 0,
    pendingPaymentsCount: 0,
    failedPaymentsCount: 0,
    totalTransactionsCount: 0,
    todayRevenueINR: 0,
    weeklyRevenueINR: 0,
    monthlyRevenueINR: 0,
    yearlyRevenueINR: 0,
    platformEarningsINR: 0,
    instructorEarningsINR: 0,
  };

  // 1. Format Student Payments
  const studentPayments: StudentPaymentRecord[] = apiPayments.map((p: any) => ({
    id: p.id,
    transactionId: p.gatewayPaymentId || p.orderNumber || p.id,
    studentId: p.studentId,
    studentName: p.studentName,
    studentEmail: p.studentEmail,
    studentAvatar: p.studentAvatar || '',
    courseId: p.courseId,
    courseName: p.courseName,
    instructorName: p.instructorName,
    paymentMethod: p.paymentMethod || 'Razorpay',
    amountINR: p.amount,
    purchaseDate: new Date(p.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    paymentStatus: p.status === 'Success' ? 'Paid' : p.status === 'Failed' ? 'Failed' : 'Cancelled',
  }));

  // 2. Format Instructor Earnings
  const instructorEarnings: InstructorEarningRecord[] = (paymentsRes.data.instructorEarnings || []).map(
    (ie: any) => ({
      instructorId: ie.instructorId,
      instructorName: ie.instructorName,
      avatar: ie.avatar || '',
      totalCourses: ie.totalCourses || 0,
      totalStudents: ie.totalStudents || 0,
      totalRevenueINR: ie.totalRevenueINR || 0,
      platformCommissionINR: ie.platformCommissionINR || 0,
      instructorEarningsINR: ie.instructorEarningsINR || 0,
    })
  );

  // 3. Format Real Payout Records
  const payouts: InstructorPayoutRecord[] = (paymentsRes.data.instructorEarnings || []).map((ie: any) => {
    const payoutInfo = ie.payoutInfo;
    const method = payoutInfo?.selectedMethod || 'Bank Account';
    let details = 'Bank details not registered';

    if (method === 'UPI ID' && payoutInfo?.upiDetails?.upiId) {
      details = `UPI: ${payoutInfo.upiDetails.upiId} (${payoutInfo.upiDetails.upiAccountName || ie.instructorName})`;
    } else if (payoutInfo?.bankDetails?.accountNumber) {
      const acc = payoutInfo.bankDetails.accountNumber;
      const maskedAcc = acc.length > 4 ? `•••• ${acc.slice(-4)}` : acc;
      details = `${payoutInfo.bankDetails.bankName || 'Bank'}: ${maskedAcc} (IFSC: ${payoutInfo.bankDetails.ifscCode || 'N/A'})`;
    }

    const hasValidBank = Boolean(
      payoutInfo?.bankDetails?.accountNumber?.toString().trim() &&
        payoutInfo?.bankDetails?.ifscCode?.toString().trim()
    );
    const hasValidUpi = Boolean(payoutInfo?.upiDetails?.upiId?.toString().trim());
    const hasValidPayoutDetails = hasValidBank || hasValidUpi;

    const pendingAmount = Number(
      ie.pendingBalanceINR !== undefined ? ie.pendingBalanceINR : ie.instructorEarningsINR || 0
    );
    const totalPaid = Number(ie.totalPaidAmountINR || 0);

    let status: PayoutStatusType = 'No Dues';
    if (pendingAmount > 0) {
      status = 'Pending';
    } else if (totalPaid > 0) {
      status = 'Settled';
    } else {
      status = 'No Dues';
    }

    // Determine clean last payout date (only when actual disbursement happened)
    let lastDate = '—';
    if (payoutInfo?.lastPayoutDate) {
      lastDate = payoutInfo.lastPayoutDate;
    } else if (Array.isArray(payoutInfo?.payoutHistory) && payoutInfo.payoutHistory.length > 0) {
      const sorted = [...payoutInfo.payoutHistory].sort((a: any, b: any) =>
        new Date(b.paymentDate || b.createdAt || 0).getTime() - new Date(a.paymentDate || a.createdAt || 0).getTime()
      );
      if (sorted[0]?.paymentDate) {
        lastDate = sorted[0].paymentDate;
      }
    }

    return {
      id: `payout-${ie.instructorId}`,
      instructorId: ie.instructorId,
      instructorName: ie.instructorName,
      avatar: ie.avatar || '',
      payoutMethod: method,
      accountDetails: details,
      amountPayableINR: pendingAmount,
      lastPaymentDate: lastDate,
      payoutStatus: status,
      hasValidPayoutDetails,
    };
  });

  // 4. Format Persistent Payment History
  let history: PaymentHistoryRecord[] = [];
  if (payoutsRes && payoutsRes.success && Array.isArray(payoutsRes.data)) {
    history = payoutsRes.data.map((h: any) => ({
      id: h.id,
      payoutId: `payout-${h.instructorId}`,
      instructorName: h.instructorName || 'Instructor',
      amountINR: Number(h.amount || 0),
      paymentMethod: h.payoutMethod || 'Bank Transfer',
      transactionId: h.transactionId || 'N/A',
      paymentDate: h.paymentDate || new Date().toISOString().split('T')[0],
      notes: h.notes || 'Admin instructor payout confirmed.',
    }));
  }

  return {
    summary: rawSummary,
    studentPayments,
    instructorEarnings,
    payouts,
    history,
  };
}

/**
 * Preloads Admin Payments data into React Query cache silently in the background
 */
export async function preloadAdminPayments(queryClient: QueryClient): Promise<void> {
  try {
    await queryClient.prefetchQuery({
      queryKey: ADMIN_PAYMENTS_QUERY_KEY,
      queryFn: fetchAdminPaymentsData,
      staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
      gcTime: 1000 * 60 * 15, // 15 minutes in-memory retention
    });
  } catch {
    // Non-blocking background prefetch error handled silently
  }
}

/**
 * Hook to retrieve cached & real-time Admin Payments data
 */
export function useAdminPayments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ADMIN_PAYMENTS_QUERY_KEY,
    queryFn: fetchAdminPaymentsData,
    staleTime: 0,
    gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const recordPayoutMutation = useMutation({
    mutationFn: async (payload: {
      instructorId: string;
      amount: number;
      transactionId: string;
      payoutMethod: string;
      notes?: string;
      paymentDate?: string;
    }) => {
      const res = await adminService.recordInstructorPayout(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to record payout');
      }
      return res;
    },
    onSuccess: () => {
      // Invalidate relevant admin payment & dashboard queries silently
      queryClient.invalidateQueries({ queryKey: ADMIN_PAYMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
    },
  });

  const autoDisbursePayoutMutation = useMutation({
    mutationFn: async (payload: {
      instructorId: string;
      amount: number;
      notes?: string;
      preferredMethod?: 'auto' | 'Bank Account' | 'UPI ID';
    }) => {
      const res = await adminService.autoDisburseInstructorPayout(payload);
      if (!res.success) {
        throw new Error(res.message || 'Failed to auto-disburse payout');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PAYMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
    },
  });

  return {
    ...query,
    recordPayout: recordPayoutMutation.mutateAsync,
    isSubmittingPayout: recordPayoutMutation.isPending,
    autoDisbursePayout: autoDisbursePayoutMutation.mutateAsync,
    isAutoDisbursing: autoDisbursePayoutMutation.isPending,
  };
}

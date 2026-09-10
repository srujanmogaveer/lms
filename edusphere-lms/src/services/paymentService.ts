import { api, type ApiResponse } from './apiClient';
import type {
  CreatePaymentOrderResponse,
  VerifyPaymentDto,
  PaymentHistoryItem,
} from '../types';

export const paymentService = {
  /**
   * 1. Initialize checkout payment order (server-side price calculation)
   */
  async createCheckoutOrder(courseId?: string): Promise<ApiResponse<CreatePaymentOrderResponse>> {
    return api.post<CreatePaymentOrderResponse>('/student/payment/create-order', {
      courseId,
    });
  },

  /**
   * 2. Cryptographically verify payment on server & trigger enrollment
   */
  async verifyPayment(
    dto: VerifyPaymentDto
  ): Promise<ApiResponse<{ success: boolean; orderNumber: string; message: string }>> {
    return api.post<{ success: boolean; orderNumber: string; message: string }>(
      '/student/payment/verify',
      dto
    );
  },

  /**
   * 3. Fetch authenticated student's real payment history
   */
  async getPaymentHistory(): Promise<ApiResponse<PaymentHistoryItem[]>> {
    return api.get<PaymentHistoryItem[]>('/student/payment/history');
  },

  /**
   * 4. Fetch admin payments, real statistics, and order ledgers
   */
  async getAdminPayments(): Promise<
    ApiResponse<{
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
        platformCommissionPercent?: number;
        platformCommissionRate?: number;
        instructorEarningsINR: number;
      };
      payments: any[];
      instructorEarnings: any[];
    }>
  > {
    return api.get('/admin/payments');
  },

  /**
   * 5. Fetch authenticated instructor's real revenue breakdown, balance, and persistent payout history
   */
  async getInstructorEarnings(instructorId?: string): Promise<ApiResponse<any>> {
    const params = instructorId ? { instructorId } : {};
    return api.get('/instructor/earnings', params);
  },

  /**
   * 6. Fetch authenticated instructor's comprehensive real revenue and analytics data
   */
  async getInstructorAnalytics(instructorId?: string): Promise<ApiResponse<any>> {
    const params = instructorId ? { instructorId } : {};
    return api.get('/instructor/analytics', params);
  },
};

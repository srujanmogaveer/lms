import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
  FiSmartphone,
  FiTrendingUp,
  FiPercent,
  FiArrowRight,
  FiFileText,
  FiLoader,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { paymentService } from '../../services/paymentService';

interface InstructorEarningsSectionProps {
  instructorId?: string;
}

export const InstructorEarningsSection: React.FC<InstructorEarningsSectionProps> = ({
  instructorId,
}) => {
  const navigate = useNavigate();
  const { currentUser, rawProfile } = useAuth();
  const { settings } = usePlatformSettings();

  const commissionPercent = settings?.platformCommissionPercent ?? 15;
  const instructorPercent = 100 - commissionPercent;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [financials, setFinancials] = useState<{
    totalGrossRevenueINR: number;
    platformCommissionINR: number;
    netEarningsINR: number;
    totalPaidAmountINR: number;
    pendingBalanceINR: number;
    payoutHistory: any[];
    payoutInfo: any;
  }>({
    totalGrossRevenueINR: 0,
    platformCommissionINR: 0,
    netEarningsINR: 0,
    totalPaidAmountINR: 0,
    pendingBalanceINR: 0,
    payoutHistory: [],
    payoutInfo: null,
  });

  const fetchEarnings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await paymentService.getInstructorEarnings(instructorId);
      if (res.success && res.data) {
        setFinancials({
          totalGrossRevenueINR: res.data.totalGrossRevenueINR || 0,
          platformCommissionINR: res.data.platformCommissionINR || 0,
          netEarningsINR: res.data.netEarningsINR || 0,
          totalPaidAmountINR: res.data.totalPaidAmountINR || 0,
          pendingBalanceINR: res.data.pendingBalanceINR || 0,
          payoutHistory: res.data.payoutHistory || [],
          payoutInfo: res.data.payoutInfo || rawProfile?.payoutInfo,
        });
      }
    } catch (err) {
      console.error('Failed to load instructor earnings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [instructorId, rawProfile]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const activePayoutInfo = financials.payoutInfo || rawProfile?.payoutInfo;
  const payoutMethod = activePayoutInfo?.selectedMethod || 'Bank Account';
  const hasBankDetails = Boolean(activePayoutInfo?.bankDetails?.accountNumber);
  const hasUpiDetails = Boolean(activePayoutInfo?.upiDetails?.upiId);

  return (
    <div className="space-y-6">
      {/* INSTRUCTOR EARNINGS SUMMARY CARDS */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FiDollarSign className="w-4 h-4 text-emerald-600" />
              Instructor Earnings & Payout Breakdown
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time net earnings calculation after platform commission ({commissionPercent}%), verified payouts, and pending balances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
              {payoutMethod === 'UPI ID' || payoutMethod === 'UPI' ? (
                <FiSmartphone className="w-3.5 h-3.5 text-purple-600" />
              ) : (
                <FiCreditCard className="w-3.5 h-3.5 text-purple-600" />
              )}
              <span>Payout via {payoutMethod}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/instructor/profile')}
              className="text-xs font-bold flex items-center gap-1"
            >
              Configure Details <FiArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <FiLoader className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Revenue */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <FiTrendingUp className="w-3 h-3 text-purple-500" /> Total Revenue
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">
                {formatINR(financials.totalGrossRevenueINR)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Gross Course Sales</span>
            </div>

            {/* Platform Commission */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <FiPercent className="w-3 h-3 text-rose-500" /> Commission ({commissionPercent}%)
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 block">
                -{formatINR(financials.platformCommissionINR)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">EduSphere Service Fee</span>
            </div>

            {/* Total Net Earnings */}
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-1">
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider block">
                Total Earnings ({instructorPercent}%)
              </span>
              <span className="text-xl font-black text-purple-700 dark:text-purple-300 block">
                {formatINR(financials.netEarningsINR)}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Net Income Entitlement</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Net Income Entitlement</span>
            </div>

            {/* Paid Amount */}
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-1">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3 text-emerald-600" /> Paid Amount
              </span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 block">
                {formatINR(financials.totalPaidAmountINR)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Disbursed to Account</span>
            </div>

            {/* Pending Payout */}
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-1">
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider block flex items-center gap-1">
                <FiClock className="w-3 h-3 text-amber-600" /> Pending Payout
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">
                {formatINR(financials.pendingBalanceINR)}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Awaiting Admin Transfer</span>
            </div>
          </div>
        )}

        {/* Selected Payout Info Card Details */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Current Active Payout Destination
            </span>
            {payoutMethod === 'Bank Account' || payoutMethod === 'Bank Transfer' ? (
              hasBankDetails ? (
                <p className="text-slate-500 font-medium mt-0.5">
                  Bank Transfer: <span className="font-semibold text-slate-900 dark:text-slate-100">{activePayoutInfo.bankDetails.bankName || 'Bank'}</span> • A/C: <span className="font-mono">{activePayoutInfo.bankDetails.accountNumber}</span> (IFSC: <span className="font-mono uppercase">{activePayoutInfo.bankDetails.ifscCode}</span>)
                </p>
              ) : (
                <p className="text-amber-600 font-medium mt-0.5">
                  Bank details not configured yet. Click "Configure Details" to add your bank account.
                </p>
              )
            ) : hasUpiDetails ? (
              <p className="text-slate-500 font-medium mt-0.5">
                UPI Transfer: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{activePayoutInfo.upiDetails.upiId}</span> ({activePayoutInfo.upiDetails.upiAccountName || rawProfile?.fullName || (currentUser as any)?.name || 'Instructor'})
              </p>
            ) : (
              <p className="text-amber-600 font-medium mt-0.5">
                UPI ID not configured yet. Click "Configure Details" to add your UPI ID.
              </p>
            )}
          </div>
          {(hasBankDetails || hasUpiDetails) && (
            <span className="text-[11px] px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold rounded-full w-fit">
              Verified Payout Account
            </span>
          )}
        </div>
      </Card>

      {/* PAYMENT HISTORY TABLE */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-purple-600" />
              Payout Payment History
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Historical record of all manual bank and UPI payouts executed by EduSphere Admin with UTR tracking numbers.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Payouts: {financials.payoutHistory.length}
          </span>
        </div>

        {financials.payoutHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-medium">
            No payout transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Transaction ID / UTR</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {financials.payoutHistory.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      {payment.paymentDate}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                      {formatINR(payment.amount)}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {payment.payoutMethod === 'Bank Transfer' || payment.payoutMethod === 'Bank Account' ? (
                          <FiCreditCard className="w-3 h-3" />
                        ) : (
                          <FiSmartphone className="w-3 h-3" />
                        )}
                        {payment.payoutMethod}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-bold">
                      {payment.transactionId}
                    </td>
                    <td className="p-3 text-slate-500 font-medium">
                      {payment.notes || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <FiCheckCircle className="w-3 h-3" /> {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

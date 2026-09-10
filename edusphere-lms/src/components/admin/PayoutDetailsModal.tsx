import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiCreditCard, FiSmartphone, FiFileText } from 'react-icons/fi';
import type { InstructorPayoutSummary } from '../../types/payoutTypes';

interface PayoutDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: InstructorPayoutSummary;
  onMarkAsPaid: () => void;
}

export const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({
  isOpen,
  onClose,
  summary,
  onMarkAsPaid,
}) => {
  if (!isOpen) return null;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const payoutMethod = summary.payoutInfo.selectedMethod;

  const feePercent =
    (summary as any).platformCommissionPercent ??
    (summary.totalRevenue > 0
      ? Math.round((summary.platformCommission / summary.totalRevenue) * 100)
      : 15);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              {summary.photoUrl ? (
                <img
                  src={summary.photoUrl}
                  alt={summary.instructorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 font-bold text-lg">
                  {summary.instructorName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  {summary.instructorName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  ID: <span className="font-mono">{summary.instructorId}</span> • {summary.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Revenue & Commission Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Revenue</span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">{formatINR(summary.totalRevenue)}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Platform Fee ({feePercent}%)</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 block">-{formatINR(summary.platformCommission)}</span>
            </div>

            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold uppercase block">Net Earnings</span>
              <span className="text-lg font-black text-purple-700 dark:text-purple-300 block">{formatINR(summary.instructorEarnings)}</span>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase block">Pending Amount</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 block">{formatINR(summary.pendingAmount)}</span>
            </div>
          </div>

          {/* Instructor Payout Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {payoutMethod === 'Bank Account' ? <FiCreditCard className="w-4 h-4 text-purple-600" /> : <FiSmartphone className="w-4 h-4 text-purple-600" />}
                Instructor Selected Payout Method: {payoutMethod}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                summary.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}>
                {summary.paymentStatus}
              </span>
            </div>

            {payoutMethod === 'Bank Account' ? (
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>Account Holder: <span className="font-bold">{summary.payoutInfo.bankDetails.accountHolderName}</span></div>
                <div>Bank Name: <span className="font-bold">{summary.payoutInfo.bankDetails.bankName}</span></div>
                <div>Account No: <span className="font-mono font-bold">{summary.payoutInfo.bankDetails.accountNumber}</span></div>
                <div>IFSC Code: <span className="font-mono font-bold uppercase">{summary.payoutInfo.bankDetails.ifscCode}</span></div>
                <div>Account Type: <span className="font-bold">{summary.payoutInfo.bankDetails.accountType}</span></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>UPI ID: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{summary.payoutInfo.upiDetails.upiId}</span></div>
                <div>UPI Account Holder: <span className="font-bold">{summary.payoutInfo.upiDetails.upiAccountName}</span></div>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <FiFileText className="w-4 h-4 text-purple-600" /> Payment History Log
            </h4>

            {summary.paymentHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No payment logs recorded.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">UTR / Transaction ID</th>
                      <th className="p-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {summary.paymentHistory.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-medium">{p.paymentDate}</td>
                        <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{formatINR(p.amount)}</td>
                        <td className="p-2.5">{p.paymentMethod}</td>
                        <td className="p-2.5 font-mono text-[11px] font-bold">{p.transactionId}</td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Close Window
            </button>

            {summary.pendingAmount > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onMarkAsPaid();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <FiCheckCircle className="w-4 h-4" /> Mark as Paid ({formatINR(summary.pendingAmount)})
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

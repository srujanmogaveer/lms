import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiCreditCard, FiSmartphone, FiAlertCircle } from 'react-icons/fi';
import { Button } from '../ui/Button';
import type { InstructorPayoutSummary, PaymentExecutionMethod } from '../../types/payoutTypes';
import { adminService } from '../../services/adminService';

interface MarkAsPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: InstructorPayoutSummary;
  onPaymentSuccess: (amount: number, transactionId: string) => void;
}

export const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({
  isOpen,
  onClose,
  summary,
  onPaymentSuccess,
}) => {
  const defaultMethod: PaymentExecutionMethod =
    summary.payoutInfo?.selectedMethod === 'UPI ID' ? 'UPI' : 'Bank Transfer';

  const [paymentMethod, setPaymentMethod] = useState<PaymentExecutionMethod>(defaultMethod);
  const [amount, setAmount] = useState<number>(summary.pendingAmount || 0);
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const formatINR = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasValidBank = Boolean(summary.payoutInfo?.bankDetails?.accountNumber?.toString().trim() && summary.payoutInfo?.bankDetails?.ifscCode?.toString().trim());
    const hasValidUpi = Boolean(summary.payoutInfo?.upiDetails?.upiId?.toString().trim());
    if (!hasValidBank && !hasValidUpi) {
      setError('Instructor has not configured valid payout destination details.');
      return;
    }
    if (!transactionId.trim()) {
      setError('Transaction ID / UTR Number is required');
      return;
    }
    if (amount <= 0) {
      setError('Payment Amount must be greater than 0');
      return;
    }
    if (amount > (summary.pendingAmount || 0)) {
      setError('Insufficient available instructor balance.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await adminService.recordInstructorPayout({
        instructorId: summary.instructorId,
        amount,
        payoutMethod: paymentMethod,
        transactionId: transactionId.trim(),
        paymentDate,
        notes: notes.trim() || 'Admin instructor payout confirmed.',
      });

      if (res.success) {
        onPaymentSuccess(amount, transactionId.trim());
        onClose();
      } else {
        setError(res.message || 'Failed to record payout');
      }
    } catch (err: any) {
      setError(err.message || 'Insufficient available instructor balance.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                Mark Instructor Payout as Paid
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Instructor: <span className="font-bold text-slate-800 dark:text-slate-200">{summary.instructorName}</span> ({summary.instructorId})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Instructor Payout Info Box */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900 text-xs space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-300 font-bold">
              <span>Pending Balance:</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold">{formatINR(summary.pendingAmount)}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Registered Payout Choice: <span className="font-bold text-purple-700 dark:text-purple-300">{summary.payoutInfo?.selectedMethod || 'Bank Account'}</span>
              {summary.payoutInfo?.selectedMethod === 'Bank Account' ? (
                <span> — {summary.payoutInfo?.bankDetails?.bankName || 'Bank'} (A/C: {summary.payoutInfo?.bankDetails?.accountNumber}, IFSC: {summary.payoutInfo?.bankDetails?.ifscCode})</span>
              ) : (
                <span> — UPI ID: {summary.payoutInfo?.upiDetails?.upiId} ({summary.payoutInfo?.upiDetails?.upiAccountName || summary.instructorName})</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Payment Method Option */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Payment Method Used *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank Transfer')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                    paymentMethod === 'Bank Transfer'
                      ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <FiCreditCard className="w-4 h-4" /> Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <FiSmartphone className="w-4 h-4" /> UPI
                </button>
              </div>
            </div>

            {/* Amount Paid */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Amount Paid (₹) *
                </label>
                <span className="text-[11px] text-slate-400">
                  Max: {formatINR(summary.pendingAmount)}
                </span>
              </div>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={summary.pendingAmount}
                min={1}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Transaction ID / UTR Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction ID / UTR Number *
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UTR948201948201 or UPI849102749"
                className="w-full px-3 py-2 font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. August 2026 Monthly Earnings Settlement"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting || amount > summary.pendingAmount || amount <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <FiCheckCircle className="w-4 h-4" /> {isSubmitting ? 'Recording...' : 'Confirm Payment'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

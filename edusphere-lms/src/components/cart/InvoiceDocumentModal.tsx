import React from 'react';
import { FiX, FiPrinter, FiCheckCircle, FiBookOpen } from 'react-icons/fi';
import { Button } from '../ui/Button';
import type { StudentTransactionRecord } from '../../data/studentPaymentStore';

interface InvoiceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: StudentTransactionRecord | null;
}

export const InvoiceDocumentModal: React.FC<InvoiceDocumentModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header with Close & Print */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black">
              E
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Course Payment Invoice</h2>
              <p className="text-xs text-slate-400">EduSphere Online Learning</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs"
            >
              <FiPrinter className="w-3.5 h-3.5" /> Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">Payment Completed</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                {transaction.transactionId}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold font-mono px-3 py-1 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 rounded-lg shadow-sm">
            {transaction.status === 'Paid' ? 'PAID' : transaction.status}
          </span>
        </div>

        {/* Invoice Key Fields Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Invoice Number</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{transaction.invoiceNumber}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Transaction ID</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{transaction.transactionId}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Student Name</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{transaction.studentName}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Payment Date</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{transaction.purchaseDate}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Payment Method</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{transaction.paymentMethod}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Instructor</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{transaction.instructorName}</span>
          </div>
        </div>

        {/* Itemized Course Description */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-3 text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>Course Description</span>
            <span>Amount</span>
          </div>
          <div className="p-4 flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <FiBookOpen className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{transaction.courseName}</h4>
                <p className="text-[11px] text-slate-400">Full Lifetime Access & Certificate of Completion</p>
              </div>
            </div>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 shrink-0">
              ₹{transaction.amountINR.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Total Amount Paid</span>
            <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
              ₹{transaction.amountINR.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <Button variant="primary" onClick={onClose} className="w-full justify-center">
            Close Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

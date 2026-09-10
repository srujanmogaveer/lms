import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiCreditCard,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowLeft,
  FiSearch,
  FiLoader,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { InvoiceDocumentModal } from '../../components/cart/InvoiceDocumentModal';
import { EmptyState } from '../../components/ui/EmptyState';
import type { PaymentHistoryItem } from '../../types';
import type { StudentTransactionRecord } from '../../data/studentPaymentStore';

export const StudentPaymentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<StudentTransactionRecord | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const res = await paymentService.getPaymentHistory();
        if (res.success && Array.isArray(res.data)) {
          setPayments(res.data);
        }
      } catch (err) {
        console.error('Failed to load payment history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesOrder = p.orderNumber.toLowerCase().includes(term);
    const matchesGatewayId = (p.gatewayPaymentId || '').toLowerCase().includes(term);
    const matchesCourse = p.courses.some((c) => c.title.toLowerCase().includes(term));
    return matchesOrder || matchesGatewayId || matchesCourse;
  });

  const handleOpenInvoice = (p: PaymentHistoryItem) => {
    const firstCourse = p.courses[0];
    const txnRecord: StudentTransactionRecord = {
      id: p.id,
      studentName: currentUser?.name || 'Student',
      courseId: firstCourse?.id || 'course-id',
      courseName: p.courses.map((c) => c.title).join(', ') || 'EduSphere Masterclass',
      courseThumbnail: firstCourse?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300',
      instructorName: firstCourse?.instructorName || 'Lead Instructor',
      amountINR: p.amount,
      paymentMethod: (p.paymentMethod as any) || 'Razorpay',
      transactionId: p.gatewayPaymentId || p.id,
      invoiceNumber: `INV-${p.orderNumber}`,
      purchaseDate: new Date(p.paidAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: p.status === 'Success' ? 'Paid' : 'Failed',
    };
    setSelectedTxn(txnRecord);
    setIsInvoiceOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiCreditCard className="w-6 h-6 text-brand-600" />
            <span>Payment History</span>
          </h1>
          <p className="text-xs text-slate-500">
            View verified transaction receipts, payment statuses, and download official invoices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/student/browse-courses')}
          className="flex items-center gap-1.5 text-xs w-fit"
        >
          <FiArrowLeft className="w-4 h-4" /> Browse More Courses
        </Button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by course name, order number, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>

      {/* Transactions Table / List */}
      {isLoading ? (
        <Card className="p-12 text-center space-y-3">
          <FiLoader className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading payment history from database...</p>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="p-8 text-center">
          <EmptyState
            title="No Payment History Found"
            description="You have not completed any course purchase transactions matching your search criteria."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Course(s)</th>
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => {
                  const isSuccess = p.status === 'Success';
                  const isFailed = p.status === 'Failed';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Course Info */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {p.courses.map((c, i) => (
                            <span key={i} className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 block max-w-xs">
                              {c.title}
                            </span>
                          ))}
                          {p.courses.length === 0 && (
                            <span className="text-slate-400">EduSphere Enrollment</span>
                          )}
                        </div>
                      </td>

                      {/* Order Number */}
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.orderNumber}
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>

                      {/* Payment Method */}
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                        {p.paymentMethod || 'Razorpay Online'}
                      </td>

                      {/* Date */}
                      <td className="p-4 font-mono text-[11px] text-slate-500">
                        {new Date(p.paidAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isSuccess ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit text-[10px]">
                            <FiCheckCircle className="w-3 h-3" /> Success
                          </Badge>
                        ) : isFailed ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit text-[10px]">
                            <FiXCircle className="w-3 h-3" /> Failed
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit text-[10px]">
                            <FiClock className="w-3 h-3" /> Pending
                          </Badge>
                        )}
                      </td>

                      {/* Invoice Link */}
                      <td className="p-4 text-right">
                        {isSuccess ? (
                          <button
                            onClick={() => handleOpenInvoice(p)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                          >
                            <FiFileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invoice Printable Modal */}
      <InvoiceDocumentModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        transaction={selectedTxn}
      />
    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDollarSign,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiDownload,
  FiUserCheck,
  FiUser,
  FiBookOpen,
  FiX,
  FiSend,
  FiRotateCcw,
  FiLoader,
  FiAlertTriangle,
  FiZap,
  FiShield
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  type StudentPaymentRecord,
  type InstructorPayoutRecord
} from '../../data/paymentsData';
import { useAdminPayments } from '../../hooks/useAdminPayments';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { Avatar } from '../../components/common/Avatar';
import { SkeletonLoader } from '../../components/loaders/Loaders';

export const AdminInstructorPayouts: React.FC = () => {
  const { settings } = usePlatformSettings();
  const commissionRate = (settings?.platformCommissionPercent ?? 15) / 100;

  // Use React Query for instantaneous cache rendering and silent background revalidation
  const {
    data: adminData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    recordPayout,
    isSubmittingPayout,
    autoDisbursePayout,
    isAutoDisbursing,
  } = useAdminPayments();

  const studentPayments = useMemo(() => adminData?.studentPayments || [], [adminData]);
  const instructorEarnings = useMemo(() => adminData?.instructorEarnings || [], [adminData]);
  const payouts = useMemo(() => adminData?.payouts || [], [adminData]);
  const history = useMemo(() => adminData?.history || [], [adminData]);
  const adminSummary = useMemo(
    () =>
      adminData?.summary || {
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
      },
    [adminData]
  );

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'student_payments' | 'instructor_earnings' | 'instructor_payouts' | 'payment_history'>('student_payments');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');

  // Modals state
  const [selectedStudentPayment, setSelectedStudentPayment] = useState<StudentPaymentRecord | null>(null);
  const [selectedPayoutForMarkPaid, setSelectedPayoutForMarkPaid] = useState<InstructorPayoutRecord | null>(null);
  const [selectedPayoutDetails, setSelectedPayoutDetails] = useState<InstructorPayoutRecord | null>(null);

  // Mark as Paid & Automated Disburse form inputs
  const [payoutMode, setPayoutMode] = useState<'razorpayx' | 'manual'>('razorpayx');
  const [utrInput, setUtrInput] = useState<string>('');
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notesInput, setNotesInput] = useState<string>('');
  const [payoutAmountInput, setPayoutAmountInput] = useState<number>(0);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for formatting Indian Rupee currency (₹)
  const formatINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Metrics computation (Only Success payments count toward real revenue)
  const totalRevenue = adminSummary.totalPaidAmount;
  const platformEarnings = adminSummary.platformEarningsINR || (totalRevenue * commissionRate);
  const instructorEarningsSum = adminSummary.instructorEarningsINR || (totalRevenue * (1 - commissionRate));
  const totalTransactionsCount = adminSummary.totalTransactionsCount;

  // Dynamic commission percentages from backend summary or platform settings
  const platformPercent =
    (adminSummary as any)?.platformCommissionPercent ??
    settings?.platformCommissionPercent ??
    (totalRevenue > 0 ? Math.round((platformEarnings / totalRevenue) * 100) : 15);
  const instructorPercent = 100 - platformPercent;

  // Filtered Student Payments
  const filteredStudentPayments = useMemo(() => {
    return studentPayments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        p.studentName.toLowerCase().includes(q) ||
        p.transactionId.toLowerCase().includes(q) ||
        p.courseName.toLowerCase().includes(q) ||
        p.instructorName.toLowerCase().includes(q);

      const matchesStatus = paymentStatusFilter === 'All' || p.paymentStatus === paymentStatusFilter;
      const matchesMethod = paymentMethodFilter === 'All' || p.paymentMethod.includes(paymentMethodFilter);

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [studentPayments, searchQuery, paymentStatusFilter, paymentMethodFilter]);

  // Filtered Instructor Payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        p.instructorName.toLowerCase().includes(q) ||
        p.accountDetails.toLowerCase().includes(q);

      const matchesStatus = payoutStatusFilter === 'All' || p.payoutStatus === payoutStatusFilter;
      const matchesMethod = paymentMethodFilter === 'All' || p.payoutMethod === paymentMethodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payouts, searchQuery, payoutStatusFilter, paymentMethodFilter]);

  // Execute 1-Click Instant Automated Payout (RazorpayX)
  const handleAutoDisburse = async () => {
    if (!selectedPayoutForMarkPaid) return;
    if (!selectedPayoutForMarkPaid.hasValidPayoutDetails) {
      alert('Instructor has not configured valid payout destination details (Bank Account or UPI ID).');
      return;
    }
    if (payoutAmountInput <= 0) {
      alert('Payout amount must be greater than 0.');
      return;
    }
    if (payoutAmountInput > selectedPayoutForMarkPaid.amountPayableINR) {
      alert('Insufficient available instructor balance.');
      return;
    }

    try {
      const res = await autoDisbursePayout({
        instructorId: selectedPayoutForMarkPaid.instructorId,
        amount: payoutAmountInput,
        notes: notesInput || 'Automated 1-Click Instant Payout via RazorpayX',
        preferredMethod: selectedPayoutForMarkPaid.payoutMethod === 'UPI ID' ? 'UPI ID' : 'Bank Account',
      });

      const utrReturned = res.data?.utr || 'PROCESSED';
      showToast(
        `⚡ Instant Payout of ${formatINR(payoutAmountInput)} successfully disbursed to ${selectedPayoutForMarkPaid.instructorName}! (UTR: ${utrReturned})`
      );
      setSelectedPayoutForMarkPaid(null);
      setUtrInput('');
      setNotesInput('');
      setPayoutAmountInput(0);
    } catch (err: any) {
      alert(err.message || 'Failed to disburse automated payout.');
    }
  };

  // Execute Mark as Paid Action with strict balance and payout details validation
  const handleConfirmMarkAsPaid = async () => {
    if (!selectedPayoutForMarkPaid) return;
    if (!selectedPayoutForMarkPaid.hasValidPayoutDetails) {
      alert('Instructor has not configured valid payout destination details.');
      return;
    }
    if (!utrInput.trim()) {
      alert('Please enter a valid Transaction ID or UTR Number.');
      return;
    }
    if (payoutAmountInput <= 0) {
      alert('Payout amount must be greater than 0.');
      return;
    }
    if (payoutAmountInput > selectedPayoutForMarkPaid.amountPayableINR) {
      alert('Insufficient available instructor balance.');
      return;
    }

    try {
      await recordPayout({
        instructorId: selectedPayoutForMarkPaid.instructorId,
        amount: payoutAmountInput,
        payoutMethod: selectedPayoutForMarkPaid.payoutMethod,
        transactionId: utrInput.trim(),
        paymentDate: paymentDateInput,
        notes: notesInput || 'Manual instructor payout confirmed.',
      });

      showToast(
        `Payout of ${formatINR(payoutAmountInput)} to ${selectedPayoutForMarkPaid.instructorName} confirmed! (UTR: ${utrInput.trim()})`
      );
      setSelectedPayoutForMarkPaid(null);
      setUtrInput('');
      setNotesInput('');
      setPayoutAmountInput(0);
    } catch (err: any) {
      alert(err.message || 'Insufficient available instructor balance.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPaymentStatusFilter('All');
    setPayoutStatusFilter('All');
    setPaymentMethodFilter('All');
  };

  // 1. Initial Load: Skeleton Loader only on first mount when no cached data exists
  if (isLoading && !adminData) {
    return (
      <div className="space-y-6 pb-16 font-sans">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <SkeletonLoader className="h-8 w-72 rounded-xl" />
          <SkeletonLoader className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader className="h-24 rounded-[20px]" />
          <SkeletonLoader className="h-24 rounded-[20px]" />
          <SkeletonLoader className="h-24 rounded-[20px]" />
          <SkeletonLoader className="h-24 rounded-[20px]" />
        </div>
        <SkeletonLoader className="h-28 rounded-[24px]" />
        <SkeletonLoader className="h-14 rounded-[20px]" />
        <SkeletonLoader className="h-96 rounded-[24px]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <FiCheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <FiDollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" /> Admin Payments & Instructor Payouts Studio
            </h1>
            {isFetching && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
                <FiLoader className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
                Syncing...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor platform revenue, student payment transactions, instructor earnings share ({instructorPercent}%), and record manual payouts via Bank Account or UPI with UTR tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <FiRotateCcw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast('Exporting financial ledger report...')}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* 1. Dashboard Cards (Top Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiDollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Revenue</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{formatINR(totalRevenue)}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Platform Earnings ({platformPercent}%)</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{formatINR(platformEarnings)}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-3">
          <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
            <FiUserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Instructor Earnings ({instructorPercent}%)</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{formatINR(instructorEarningsSum)}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
            <FiCreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Transactions</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalTransactionsCount}</h3>
          </div>
        </Card>
      </div>

      {/* 2. Revenue Summary Breakdown */}
      <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <FiTrendingUp className="w-4 h-4 text-emerald-500" /> Platform Revenue Summary Breakdown (₹)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Today's Revenue</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(adminSummary.todayRevenueINR)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Weekly Revenue</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(adminSummary.weeklyRevenueINR)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Revenue</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(adminSummary.monthlyRevenueINR)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Yearly Revenue</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(adminSummary.yearlyRevenueINR)}
            </span>
          </div>
        </div>
      </Card>

      {/* 3. Search & Multi-Filters Toolbar */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Student, Instructor, Transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="text-xs rounded-xl flex items-center gap-1.5"
            >
              <FiRotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiFilter className="w-3 h-3" /> Payment Status:
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiClock className="w-3 h-3" /> Payout Status:
            </label>
            <select
              value={payoutStatusFilter}
              onChange={(e) => setPayoutStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Payout Statuses</option>
              <option value="Pending">Pending Payouts</option>
              <option value="Settled">Settled Payouts</option>
              <option value="No Dues">No Dues</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiCreditCard className="w-3 h-3" /> Payment / Payout Method:
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI (GPay / PhonePe / ID)</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Bank Account">Bank Account</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error state banner */}
      {isError && (
        <Card className="p-6 rounded-[24px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Failed to load payment records</h4>
              <p className="text-xs opacity-90">{error ? (error as Error).message : 'Failed to retrieve payment data from server.'}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => refetch()}
            className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl py-2 px-4 shadow-sm"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs">
        {[
          { id: 'student_payments', label: `Student Payments (${filteredStudentPayments.length})`, icon: FiCreditCard },
          { id: 'instructor_earnings', label: `Instructor Earnings (${instructorEarnings.length})`, icon: FiTrendingUp },
          { id: 'instructor_payouts', label: `Instructor Payouts (${filteredPayouts.length})`, icon: FiDollarSign },
          { id: 'payment_history', label: `Payment History (${history.length})`, icon: FiClock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: STUDENT PAYMENTS */}
      {/* ======================================================== */}
      {activeTab === 'student_payments' && (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {filteredStudentPayments.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Payment Records Found</p>
              <p className="text-xs text-slate-400">There are no student purchase records in the database matching the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Transaction ID</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Course Title</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Amount (₹)</th>
                    <th className="py-3.5 px-4">Purchase Date</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {payment.transactionId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={payment.studentAvatar}
                            name={payment.studentName}
                            size="sm"
                            className="w-8 h-8 rounded-full border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {payment.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {payment.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {payment.courseName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Instructor: {payment.instructorName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {payment.paymentMethod}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">
                        {formatINR(payment.amountINR)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {payment.purchaseDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            payment.paymentStatus === 'Paid'
                              ? 'success'
                              : payment.paymentStatus === 'Failed'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {payment.paymentStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStudentPayment(payment)}
                          className="text-xs py-1 px-3 rounded-xl flex items-center gap-1.5 ml-auto"
                        >
                          <FiEye className="w-3.5 h-3.5" /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: INSTRUCTOR EARNINGS */}
      {/* ======================================================== */}
      {activeTab === 'instructor_earnings' && (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {instructorEarnings.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Instructor Earnings Recorded</p>
              <p className="text-xs text-slate-400">Earnings will be automatically computed as students purchase courses created by instructors.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Instructor</th>
                    <th className="py-3.5 px-4 text-center">Total Courses</th>
                    <th className="py-3.5 px-4 text-center">Total Students</th>
                    <th className="py-3.5 px-4">Total Gross Revenue</th>
                    <th className="py-3.5 px-4">Platform Share ({platformPercent}%)</th>
                    <th className="py-3.5 px-4">Instructor Share ({instructorPercent}%)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {instructorEarnings.map((ie) => (
                    <tr key={ie.instructorId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={ie.avatar}
                            name={ie.instructorName}
                            size="sm"
                            className="w-9 h-9 rounded-full border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {ie.instructorName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ie.instructorId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {ie.totalCourses}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {ie.totalStudents}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(ie.totalRevenueINR)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {formatINR(ie.platformCommissionINR)}
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatINR(ie.instructorEarningsINR)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: INSTRUCTOR PAYOUTS */}
      {/* ======================================================== */}
      {activeTab === 'instructor_payouts' && (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {filteredPayouts.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Instructor Payouts Found</p>
              <p className="text-xs text-slate-400">Payout records will appear here as instructor course revenues are processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Instructor</th>
                    <th className="py-3.5 px-4">Payout Method</th>
                    <th className="py-3.5 px-4">Bank Account / Details</th>
                    <th className="py-3.5 px-4">Amount Payable (₹)</th>
                    <th className="py-3.5 px-4">Last Payout Date</th>
                    <th className="py-3.5 px-4">Payout Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={payout.avatar}
                            name={payout.instructorName}
                            size="sm"
                            className="w-8 h-8 rounded-full border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {payout.instructorName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {payout.instructorId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        <Badge variant="neutral">{payout.payoutMethod}</Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {payout.accountDetails}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100 text-sm">
                        {formatINR(payout.amountPayableINR)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {payout.lastPaymentDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={payout.payoutStatus === 'Settled' ? 'success' : payout.payoutStatus === 'Pending' ? 'warning' : 'neutral'}>
                          {payout.payoutStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPayoutDetails(payout)}
                            className="text-xs py-1 px-2.5 rounded-xl flex items-center gap-1"
                          >
                            <FiEye className="w-3.5 h-3.5" /> Details
                          </Button>

                          {payout.payoutStatus === 'Pending' && (
                            payout.hasValidPayoutDetails ? (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    setSelectedPayoutForMarkPaid(payout);
                                    setPayoutMode('razorpayx');
                                    setPayoutAmountInput(payout.amountPayableINR);
                                    setUtrInput(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
                                    setPaymentDateInput(new Date().toISOString().split('T')[0]);
                                  }}
                                  className="text-xs py-1 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center gap-1 font-black shadow-sm"
                                  title="1-Click Instant Automated Payout via RazorpayX"
                                >
                                  <FiZap className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> 1-Click Pay
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayoutForMarkPaid(payout);
                                    setPayoutMode('manual');
                                    setPayoutAmountInput(payout.amountPayableINR);
                                    setUtrInput(`UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
                                    setPaymentDateInput(new Date().toISOString().split('T')[0]);
                                  }}
                                  className="text-xs py-1 px-2 text-slate-600 dark:text-slate-300 rounded-xl"
                                  title="Manual Bank Transfer Settlement"
                                >
                                  <FiSend className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                                title="Instructor has not configured bank or UPI payout details"
                              >
                                <FiAlertTriangle className="w-3 h-3" /> Details Pending
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: PAYMENT HISTORY */}
      {/* ======================================================== */}
      {activeTab === 'payment_history' && (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Disbursed Payment History Found</p>
              <p className="text-xs text-slate-400">Processed instructor payouts will appear here in the historical ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Instructor Name</th>
                    <th className="py-3.5 px-4">Amount Disbursed (₹)</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Transaction / UTR Number</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {h.instructorName}
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {formatINR(h.amountINR)}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {h.paymentMethod}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {h.transactionId}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {h.paymentDate}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 italic">
                        {h.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ======================================================== */}
      {/* STUDENT PAYMENT DETAILS MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedStudentPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Payment Details">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    {selectedStudentPayment.transactionId}
                  </span>
                  <Badge
                    variant={
                      selectedStudentPayment.paymentStatus === 'Paid'
                        ? 'success'
                        : selectedStudentPayment.paymentStatus === 'Failed'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {selectedStudentPayment.paymentStatus}
                  </Badge>
                </div>

                <button
                  onClick={() => setSelectedStudentPayment(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Student Information */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-indigo-500" /> Student Profile
                </h3>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudentPayment.studentAvatar}
                    alt={selectedStudentPayment.studentName}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedStudentPayment.studentName}
                    </h4>
                    <span className="text-slate-400 font-mono">
                      ID: {selectedStudentPayment.studentId} • {selectedStudentPayment.studentEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course & Payment Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiBookOpen className="w-4 h-4 text-rose-500" /> Course Information
                  </h3>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedStudentPayment.courseName}
                  </h4>
                  <span className="text-slate-500 block">Instructor: {selectedStudentPayment.instructorName}</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiCreditCard className="w-4 h-4 text-emerald-500" /> Payment Info
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatINR(selectedStudentPayment.amountINR)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentPayment.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchase Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentPayment.purchaseDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStudentPayment(null)}
                  className="text-xs rounded-xl"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MARK AS PAID / 1-CLICK INSTANT PAYOUT MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedPayoutForMarkPaid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Disburse Instructor Payout">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {payoutMode === 'razorpayx' ? (
                      <>
                        <FiZap className="w-5 h-5 text-amber-500 animate-pulse" /> 1-Click Automated Payout (RazorpayX)
                      </>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5 text-emerald-500" /> Confirm Manual Instructor Payout
                      </>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {payoutMode === 'razorpayx'
                      ? 'Instant in-app disbursement with automatic bank UTR tracking.'
                      : 'Record an external bank transfer with manual UTR.'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPayoutForMarkPaid(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Toggle Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPayoutMode('razorpayx')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    payoutMode === 'razorpayx'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FiZap className="w-3.5 h-3.5" /> ⚡ 1-Click RazorpayX
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMode('manual')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    payoutMode === 'manual'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FiSend className="w-3.5 h-3.5" /> 📝 Manual + UTR
                </button>
              </div>

              {/* Instructor Details Card */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Instructor:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPayoutForMarkPaid.instructorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payout Method:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPayoutForMarkPaid.payoutMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Account / UPI:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPayoutForMarkPaid.accountDetails}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800">
                  <span className="text-slate-600 font-bold">Total Payable Balance:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatINR(selectedPayoutForMarkPaid.amountPayableINR)}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Disbursement Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPayoutAmountInput(selectedPayoutForMarkPaid.amountPayableINR)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Full Balance
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Max: {formatINR(selectedPayoutForMarkPaid.amountPayableINR)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={payoutAmountInput || ''}
                    onChange={(e) => setPayoutAmountInput(Number(e.target.value))}
                    max={selectedPayoutForMarkPaid.amountPayableINR}
                    min={1}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {payoutAmountInput > selectedPayoutForMarkPaid.amountPayableINR && (
                    <p className="text-[11px] text-rose-500 font-bold mt-1">
                      Insufficient available instructor balance.
                    </p>
                  )}
                </div>

                {payoutMode === 'razorpayx' ? (
                  <div className="p-3 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                      <FiShield className="w-4 h-4 text-emerald-500" />
                      <span>Direct In-App Payout via RazorpayX</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      EduSphere will instantly initiate transfer of <strong>{formatINR(payoutAmountInput)}</strong> directly to <strong>{selectedPayoutForMarkPaid.accountDetails}</strong>. The bank UTR will be auto-generated, recorded in the ledger, and synced to the instructor in real-time.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Transaction ID / UTR Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. UTR-98421099"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Payment Date</label>
                      <input
                        type="date"
                        value={paymentDateInput}
                        onChange={(e) => setPaymentDateInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder={
                      payoutMode === 'razorpayx'
                        ? 'e.g. Monthly revenue settlement via 1-Click RazorpayX'
                        : 'e.g. Processed via HDFC Corporate NetBanking UTR.'
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPayoutForMarkPaid(null)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>

                {payoutMode === 'razorpayx' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAutoDisburse}
                    disabled={isAutoDisbursing || payoutAmountInput > selectedPayoutForMarkPaid.amountPayableINR || payoutAmountInput <= 0}
                    className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl py-2 px-5 shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isAutoDisbursing ? (
                      <>
                        <FiLoader className="w-3.5 h-3.5 animate-spin" /> Disbursing...
                      </>
                    ) : (
                      <>
                        <FiZap className="w-3.5 h-3.5 text-amber-300" /> Disburse {formatINR(payoutAmountInput)} Now
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleConfirmMarkAsPaid}
                    disabled={isSubmittingPayout || payoutAmountInput > selectedPayoutForMarkPaid.amountPayableINR || payoutAmountInput <= 0}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2 px-4 shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingPayout ? 'Processing...' : 'Confirm Manual Payment'}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* PAYOUT DETAILS MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedPayoutDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Payout Details">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Instructor Payout Record
                </h3>
                <button
                  onClick={() => setSelectedPayoutDetails(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <img src={selectedPayoutDetails.avatar} alt={selectedPayoutDetails.instructorName} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedPayoutDetails.instructorName}</h4>
                    <span className="text-slate-400 font-mono">{selectedPayoutDetails.instructorId}</span>
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPayoutDetails.payoutMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account / UPI:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedPayoutDetails.accountDetails}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Payable:</span>
                    <span className="font-black text-emerald-600 text-sm">{formatINR(selectedPayoutDetails.amountPayableINR)}</span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <Badge variant={selectedPayoutDetails.payoutStatus === 'Settled' ? 'success' : selectedPayoutDetails.payoutStatus === 'Pending' ? 'warning' : 'neutral'}>
                        {selectedPayoutDetails.payoutStatus}
                      </Badge>
                    </div>
                  {selectedPayoutDetails.utrNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">UTR / Ref:</span>
                      <span className="font-mono font-bold text-indigo-600">{selectedPayoutDetails.utrNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button size="sm" variant="outline" onClick={() => setSelectedPayoutDetails(null)} className="text-xs rounded-xl">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

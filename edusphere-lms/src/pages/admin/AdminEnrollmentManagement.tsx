import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckSquare,
  FiUserCheck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSearch,
  FiFilter,
  FiEye,
  FiX,
  FiUser,
  FiBookOpen,
  FiCreditCard,
  FiAward,
  FiMapPin,
  FiMail,
  FiPhone,
  FiLayers,
  FiFileText,
  FiHelpCircle,
  FiDollarSign,
  FiCalendar,
  FiRotateCcw
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  mockEnrollmentList,
  type EnrollmentRecord
} from '../../data/enrollmentData';

export const AdminEnrollmentManagement: React.FC = () => {
  const [enrollments] = useState<EnrollmentRecord[]>(mockEnrollmentList);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('All');
  const [instructorFilter, setInstructorFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics Calculation
  const totalEnrollments = enrollments.length;
  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.enrollmentStatus === 'Active').length,
    [enrollments]
  );
  const completedEnrollments = useMemo(
    () => enrollments.filter((e) => e.enrollmentStatus === 'Completed').length,
    [enrollments]
  );
  const cancelledEnrollments = useMemo(
    () => enrollments.filter((e) => e.enrollmentStatus === 'Cancelled').length,
    [enrollments]
  );

  // Unique Lists for Dropdown Filters
  const uniqueCourses = useMemo(
    () => Array.from(new Set(enrollments.map((e) => e.course.title))),
    [enrollments]
  );

  const uniqueInstructors = useMemo(
    () => Array.from(new Set(enrollments.map((e) => e.course.instructorName))),
    [enrollments]
  );

  // Filtered Enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((record) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        record.student.name.toLowerCase().includes(q) ||
        record.student.studentId.toLowerCase().includes(q) ||
        record.course.title.toLowerCase().includes(q) ||
        record.course.instructorName.toLowerCase().includes(q) ||
        record.enrollmentId.toLowerCase().includes(q);

      const matchesCourse = courseFilter === 'All' || record.course.title === courseFilter;
      const matchesInstructor = instructorFilter === 'All' || record.course.instructorName === instructorFilter;
      const matchesStatus = statusFilter === 'All' || record.enrollmentStatus === statusFilter;
      const matchesPayment = paymentStatusFilter === 'All' || record.payment.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesCourse && matchesInstructor && matchesStatus && matchesPayment;
    });
  }, [enrollments, searchQuery, courseFilter, instructorFilter, statusFilter, paymentStatusFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setCourseFilter('All');
    setInstructorFilter('All');
    setStatusFilter('All');
    setPaymentStatusFilter('All');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Toast Banner */}
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiCheckSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Enrollment Governance & Audit Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor student course enrollments, learning progress, Indian Rupee (₹) transaction records, and certificate statuses across the platform.
          </p>
        </div>

        <Badge variant="neutral" className="self-start sm:self-auto">
          Read-Only Audit Mode
        </Badge>
      </div>

      {/* Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FiUserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Enrollments</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalEnrollments}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Enrollments</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{activeEnrollments}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Completed Courses</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{completedEnrollments}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cancelled Enrollments</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{cancelledEnrollments}</h3>
          </div>
        </Card>
      </div>

      {/* Toolbar: Search & Multi-Filters */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Student, Course, Instructor, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
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

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Course Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiFilter className="w-3 h-3" /> Filter Course:
            </label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Courses</option>
              {uniqueCourses.map((cTitle) => (
                <option key={cTitle} value={cTitle}>
                  {cTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Instructor Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiUser className="w-3 h-3" /> Filter Instructor:
            </label>
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Instructors</option>
              {uniqueInstructors.map((ins) => (
                <option key={ins} value={ins}>
                  {ins}
                </option>
              ))}
            </select>
          </div>

          {/* Enrollment Status Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiClock className="w-3 h-3" /> Enrollment Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiDollarSign className="w-3 h-3" /> Payment Status:
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Enrollment List */}
      {filteredEnrollments.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiCheckSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No enrollments found.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No student enrollment records matched your search query or filter selections.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={resetFilters}
            className="text-xs rounded-xl py-2 px-4"
          >
            Reset All Filters
          </Button>
        </Card>
      ) : (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Enrollment ID</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Enrolled On</th>
                  <th className="py-3.5 px-4">Learning Progress</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEnrollments.map((record) => (
                  <tr key={record.enrollmentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Enrollment ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {record.enrollmentId}
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={record.student.avatarUrl}
                          alt={record.student.name}
                          className="w-8 h-8 rounded-full object-cover border shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {record.student.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {record.student.studentId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Course Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {record.course.title}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-semibold">
                        {record.course.category}
                      </span>
                    </td>

                    {/* Instructor Name */}
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {record.course.instructorName}
                    </td>

                    {/* Enrollment Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {record.enrollmentDate}
                    </td>

                    {/* Learning Progress Bar */}
                    <td className="py-3.5 px-4 w-36">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-500">{record.progress.overallPercentage}%</span>
                          <span className="text-slate-400">{record.progress.lessonsCompleted}/{record.progress.totalLessons} Les</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              record.progress.overallPercentage === 100
                                ? 'bg-blue-500'
                                : record.progress.overallPercentage > 0
                                ? 'bg-emerald-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${record.progress.overallPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Payment Status Badge */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          record.payment.paymentStatus === 'Paid'
                            ? 'success'
                            : record.payment.paymentStatus === 'Pending'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        ₹{record.payment.amountINR.toLocaleString('en-IN')} • {record.payment.paymentStatus}
                      </Badge>
                    </td>

                    {/* Enrollment Status Badge */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          record.enrollmentStatus === 'Completed'
                            ? 'primary'
                            : record.enrollmentStatus === 'Active'
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {record.enrollmentStatus}
                      </Badge>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEnrollment(record)}
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
        </Card>
      )}

      {/* ======================================================== */}
      {/* ENROLLMENT DETAILS MODAL VIEW */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedEnrollment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Enrollment Details">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    {selectedEnrollment.enrollmentId}
                  </span>
                  <Badge
                    variant={
                      selectedEnrollment.enrollmentStatus === 'Completed'
                        ? 'primary'
                        : selectedEnrollment.enrollmentStatus === 'Active'
                        ? 'success'
                        : 'danger'
                    }
                  >
                    {selectedEnrollment.enrollmentStatus}
                  </Badge>
                </div>

                <button
                  onClick={() => setSelectedEnrollment(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Student Information Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-indigo-500" /> Student Profile Details
                </h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedEnrollment.student.avatarUrl}
                      alt={selectedEnrollment.student.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                    />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {selectedEnrollment.student.name}
                      </h4>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ID: {selectedEnrollment.student.studentId}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-300 font-medium text-right sm:text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <FiMail className="w-3.5 h-3.5 text-slate-400" /> {selectedEnrollment.student.email}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <FiPhone className="w-3.5 h-3.5 text-slate-400" /> {selectedEnrollment.student.mobile}
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-[11px] text-slate-400">
                      <FiMapPin className="w-3.5 h-3.5" /> {selectedEnrollment.student.city}, {selectedEnrollment.student.state}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Course & Enrollment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Course Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiBookOpen className="w-4 h-4 text-rose-500" /> Course Information
                  </h3>
                  <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase">{selectedEnrollment.course.category}</span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedEnrollment.course.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <img
                      src={selectedEnrollment.course.instructorAvatar}
                      alt={selectedEnrollment.course.instructorName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      Instructor: {selectedEnrollment.course.instructorName}
                    </span>
                  </div>
                </div>

                {/* Enrollment Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiCalendar className="w-4 h-4 text-emerald-500" /> Enrollment Information
                  </h3>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Enrollment Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEnrollment.enrollmentDate}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Course Progress:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedEnrollment.progress.overallPercentage}% Completed</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Enrollment Status:</span>
                    <Badge
                      variant={
                        selectedEnrollment.enrollmentStatus === 'Completed'
                          ? 'primary'
                          : selectedEnrollment.enrollmentStatus === 'Active'
                          ? 'success'
                          : 'danger'
                      }
                    >
                      {selectedEnrollment.enrollmentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 3. Learning Progress Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiLayers className="w-4 h-4 text-purple-500" /> Learning Progress & Milestones
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <FiBookOpen className="w-4 h-4 text-purple-500 mx-auto" />
                    <span className="text-slate-400 block text-[10px]">Lessons Completed</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedEnrollment.progress.lessonsCompleted} / {selectedEnrollment.progress.totalLessons}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <FiFileText className="w-4 h-4 text-indigo-500 mx-auto" />
                    <span className="text-slate-400 block text-[10px]">Assignments Graded</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedEnrollment.progress.assignmentsCompleted} / {selectedEnrollment.progress.totalAssignments}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <FiHelpCircle className="w-4 h-4 text-amber-500 mx-auto" />
                    <span className="text-slate-400 block text-[10px]">Quizzes Passed</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedEnrollment.progress.quizzesPassed} / {selectedEnrollment.progress.totalQuizzes}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <FiAward className="w-4 h-4 text-emerald-500 mx-auto" />
                    <span className="text-slate-400 block text-[10px]">Certificate Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedEnrollment.progress.certificateStatus}
                    </span>
                  </div>
                </div>

                {selectedEnrollment.progress.certificateId && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <FiAward className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        <strong>Certificate Issued:</strong> {selectedEnrollment.progress.certificateId} (Issued on {selectedEnrollment.progress.certificateIssuedDate})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Payment Information Card (₹ Indian Rupee) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiCreditCard className="w-4 h-4 text-emerald-500" /> Payment & Transaction Details (India Localization ₹)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Amount Paid</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ₹{selectedEnrollment.payment.amountINR.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Payment Method</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedEnrollment.payment.paymentMethod}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedEnrollment.payment.transactionId}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Payment Status</span>
                    <Badge
                      variant={
                        selectedEnrollment.payment.paymentStatus === 'Paid'
                          ? 'success'
                          : selectedEnrollment.payment.paymentStatus === 'Pending'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {selectedEnrollment.payment.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => showToast(`Viewing profile for ${selectedEnrollment.student.name}`)}
                    className="text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <FiUser className="w-3.5 h-3.5 text-indigo-500" /> View Student
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => showToast(`Viewing course ${selectedEnrollment.course.title}`)}
                    className="text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <FiBookOpen className="w-3.5 h-3.5 text-rose-500" /> View Course
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedEnrollment(null)}
                  className="text-xs rounded-xl py-2 px-4"
                >
                  Close Details
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

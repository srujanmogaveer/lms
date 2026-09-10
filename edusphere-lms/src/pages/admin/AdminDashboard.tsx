import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiCheck,
  FiX,
  FiEye,
  FiBell,
  FiFolderPlus,
  FiCreditCard,
  FiPieChart,
  FiShield,
  FiCalendar,
  FiSun,
  FiLoader,
  FiMail,
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, type AdminDashboardStats, type AdminUserProfile } from '../../services/adminService';
import { courseService } from '../../services/courseService';
import { paymentService } from '../../services/paymentService';

interface StatCardItem {
  id: string;
  title: string;
  count: string;
  trend: string;
  isPositive: boolean;
  icon: React.ReactNode;
  color: string;
}

interface PendingCourse {
  id: string;
  title: string;
  instructorName: string;
  instructorAvatar: string;
  thumbnail: string;
  submissionDate: string;
  category: string;
  price: number;
}

interface InstructorItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'Pending' | 'Approved';
  appliedDate: string;
  coursesCount: number;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCoursesCount: number;
  joinedDate: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'student' | 'instructor' | 'course_pending' | 'course_published' | 'enrollment';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'instructor_reg' | 'approval_req' | 'payment' | 'student_reg';
}

import { useQuery, useQueryClient } from '@tanstack/react-query';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatINR = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Date & Time clock effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // React Query caching for Admin Dashboard
  const { data: dashboardPayload, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const [statsRes, paymentsRes, pendingCoursesRes, instructorsRes, studentsRes] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        paymentService.getAdminPayments().catch(() => null),
        courseService.getAdminCourses({ approvalStatus: 'Pending Approval' }).catch(() => null),
        adminService.getInstructors({ limit: 5 }).catch(() => null),
        adminService.getStudents({ limit: 4 }).catch(() => null),
      ]);

      const stats: AdminDashboardStats =
        statsRes && statsRes.success && statsRes.data
          ? statsRes.data
          : {
            students: { total: 0, active: 0, inactive: 0 },
            instructors: { total: 0, pending: 0, approved: 0, active: 0 },
            courses: { total: 0, published: 0, pending: 0 },
            enrollments: { total: 0, active: 0, completed: 0 },
          };

      const sum = paymentsRes?.data?.summary;
      const commissionPercent = sum?.platformCommissionPercent || 15;
      const revenue = {
        totalPaidAmount: sum?.totalPaidAmount || 0,
        monthlyRevenueINR: sum?.monthlyRevenueINR || 0,
        platformEarningsINR: sum?.platformEarningsINR || Math.round((sum?.totalPaidAmount || 0) * (commissionPercent / 100)),
        instructorEarningsINR: sum?.instructorEarningsINR || Math.round((sum?.totalPaidAmount || 0) * (1 - commissionPercent / 100)),
        platformCommissionPercent: commissionPercent,
      };

      const rawPending = pendingCoursesRes?.data || [];
      const formattedPending: PendingCourse[] = rawPending
        .filter((c: any) => c.approvalStatus === 'Pending Approval' || c.approval_status === 'Pending Approval')
        .map((c: any) => ({
          id: c.id,
          title: c.title || 'Untitled Course',
          instructorName: c.instructorName || c.profiles?.full_name || 'EduSphere Instructor',
          instructorAvatar: c.instructorAvatar || c.profiles?.avatar_url || '',
          thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
          submissionDate: c.createdAt
            ? new Date(c.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
            : 'Recently',
          category: c.category || c.categories?.name || 'General',
          price: Number(c.price || 0),
        }));

      const rawInstructors = instructorsRes?.data || [];
      const formattedInstructors: InstructorItem[] = rawInstructors.map((inst: AdminUserProfile) => ({
        id: inst.id,
        name: inst.fullName || 'Instructor',
        email: inst.email,
        avatar: inst.avatarUrl || '',
        status: (inst.instructorApprovalStatus === 'approved' || inst.status === 'active' ? 'Approved' : 'Pending') as 'Pending' | 'Approved',
        appliedDate: inst.createdAt
          ? new Date(inst.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          : 'Recently',
        coursesCount: inst.coursesCreatedCount || 0,
      }));

      const rawStudents = studentsRes?.data || [];
      const formattedStudents: StudentItem[] = rawStudents.map((stud: AdminUserProfile) => ({
        id: stud.id,
        name: stud.fullName || 'Student',
        email: stud.email,
        avatar: stud.avatarUrl || '',
        enrolledCoursesCount: stud.enrolledCoursesCount || 0,
        joinedDate: stud.createdAt
          ? new Date(stud.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          : 'Recently',
      }));

      const dynamicActivities: ActivityItem[] = [];
      if (rawStudents.length > 0) {
        dynamicActivities.push({
          id: `act-stud-${rawStudents[0].id}`,
          title: 'Student Registration',
          description: `${rawStudents[0].fullName || 'A student'} joined EduSphere LMS`,
          time: rawStudents[0].createdAt ? new Date(rawStudents[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent',
          type: 'student',
        });
      }
      if (rawInstructors.length > 0) {
        const latestInst = rawInstructors[0];
        dynamicActivities.push({
          id: `act-inst-${latestInst.id}`,
          title: latestInst.instructorApprovalStatus === 'approved' ? 'Instructor Account Verified' : 'New Instructor Application',
          description: `${latestInst.fullName || 'Instructor'} (${latestInst.email})`,
          time: latestInst.createdAt ? new Date(latestInst.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent',
          type: 'instructor',
        });
      }
      if (formattedPending.length > 0) {
        const latestCourse = formattedPending[0];
        dynamicActivities.push({
          id: `act-course-${latestCourse.id}`,
          title: 'Course Governance Review',
          description: `"${latestCourse.title}" is pending catalog approval`,
          time: latestCourse.submissionDate,
          type: 'course_pending',
        });
      }
      const realPayments = paymentsRes?.data?.payments || [];
      if (realPayments.length > 0) {
        const latestPay = realPayments[0];
        dynamicActivities.push({
          id: `act-pay-${latestPay.id}`,
          title: 'Student Payment Verified',
          description: `₹${(latestPay.amount || 0).toLocaleString('en-IN')} paid by ${latestPay.studentName || 'Student'} for course access`,
          time: latestPay.createdAt ? new Date(latestPay.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent',
          type: 'enrollment',
        });
      }

      const dynamicNotifications: NotificationItem[] = [];
      const pendingInstCount = statsRes?.data?.instructors?.pending || 0;
      const pendingCourseCount = formattedPending.length;

      if (pendingCourseCount > 0) {
        dynamicNotifications.push({
          id: 'notif-pending-courses',
          title: 'Courses Waiting for Approval',
          message: `${pendingCourseCount} course${pendingCourseCount > 1 ? 's' : ''} in the governance queue requiring admin review.`,
          time: 'Active',
          read: false,
          type: 'approval_req',
        });
      }
      if (pendingInstCount > 0) {
        dynamicNotifications.push({
          id: 'notif-pending-instructors',
          title: 'Instructor Approval Requests',
          message: `${pendingInstCount} instructor application${pendingInstCount > 1 ? 's' : ''} awaiting qualification check.`,
          time: 'Active',
          read: false,
          type: 'instructor_reg',
        });
      }
      const paidAmt = paymentsRes?.data?.summary?.totalPaidAmount;
      if (paidAmt && paidAmt > 0) {
        dynamicNotifications.push({
          id: 'notif-revenue-status',
          title: 'Live Payment Processing',
          message: `₹${paidAmt.toLocaleString('en-IN')} successfully collected across student enrollments.`,
          time: 'Realtime',
          read: true,
          type: 'payment',
        });
      }
      const totalStuds = statsRes?.data?.students?.total || 0;
      if (totalStuds > 0) {
        dynamicNotifications.push({
          id: 'notif-students-status',
          title: 'Student Learning Network',
          message: `${totalStuds} student${totalStuds > 1 ? 's' : ''} actively registered on the platform.`,
          time: 'Platform',
          read: true,
          type: 'student_reg',
        });
      }

      return {
        dashboardStats: stats,
        revenueSummary: revenue,
        pendingCoursesList: formattedPending,
        instructorsList: formattedInstructors,
        studentsList: formattedStudents,
        activities: dynamicActivities,
        notifications: dynamicNotifications,
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const dashboardStats = dashboardPayload?.dashboardStats || {
    students: { total: 0, active: 0, inactive: 0 },
    instructors: { total: 0, pending: 0, approved: 0, active: 0 },
    courses: { total: 0, published: 0, pending: 0 },
    enrollments: { total: 0, active: 0, completed: 0 },
  };
  const revenueSummary = dashboardPayload?.revenueSummary || {
    totalPaidAmount: 0,
    monthlyRevenueINR: 0,
    platformEarningsINR: 0,
    instructorEarningsINR: 0,
  };
  const pendingCoursesList = dashboardPayload?.pendingCoursesList || [];
  const instructorsList = dashboardPayload?.instructorsList || [];
  const studentsList = dashboardPayload?.studentsList || [];
  const activities = dashboardPayload?.activities || [];
  const notifications = dashboardPayload?.notifications || [];

  // Real Course Approval Handler
  const handleApproveCourse = async (courseId: string) => {
    try {
      setActionLoadingId(courseId);
      const res = await courseService.approveCourse(courseId);
      if (res.success) {
        showToast('Course approved and published to catalog!');
        await queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      } else {
        showToast(res.message || 'Failed to approve course');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving course');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Real Course Rejection Handler
  const handleRejectCourse = async (courseId: string) => {
    try {
      setActionLoadingId(courseId);
      const res = await courseService.rejectCourse(courseId, 'Course curriculum does not meet quality guidelines.');
      if (res.success) {
        showToast('Course rejected and returned to instructor for revisions.');
        await queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      } else {
        showToast(res.message || 'Failed to reject course');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error rejecting course');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Real Instructor Approval Handler
  const handleApproveInstructor = async (instructorId: string) => {
    try {
      setActionLoadingId(instructorId);
      const res = await adminService.approveInstructor(instructorId);
      if (res.success) {
        showToast('Instructor application approved! Access granted.');
        await queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['admin-sidebar-stats'] });
      } else {
        showToast(res.message || 'Failed to approve instructor');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error approving instructor');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Real Dynamic Metric Cards
  const statsCards: StatCardItem[] = [
    {
      id: 'stat-students',
      title: 'Total Students',
      count: (dashboardStats.students.total || 0).toLocaleString('en-IN'),
      trend: `${dashboardStats.students.active} active students`,
      isPositive: true,
      icon: <FiUsers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'stat-instructors',
      title: 'Total Instructors',
      count: (dashboardStats.instructors.total || 0).toLocaleString('en-IN'),
      trend: `${dashboardStats.instructors.approved} approved educators`,
      isPositive: true,
      icon: <FiUserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      color: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    },
    {
      id: 'stat-courses',
      title: 'Total Courses',
      count: (dashboardStats.courses.published || dashboardStats.courses.total || 0).toLocaleString('en-IN'),
      trend: `${dashboardStats.courses.total} in curriculum`,
      isPositive: true,
      icon: <FiBookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'stat-approvals',
      title: 'Pending Course Approvals',
      count: `${pendingCoursesList.length || dashboardStats.courses.pending || 0}`,
      trend: pendingCoursesList.length > 0 ? 'Requires review' : 'Queue clear',
      isPositive: pendingCoursesList.length === 0,
      icon: <FiClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    },
    {
      id: 'stat-enrollments',
      title: 'Active Enrollments',
      count: (dashboardStats.enrollments.active || dashboardStats.enrollments.total || 0).toLocaleString('en-IN'),
      trend: `${dashboardStats.enrollments.completed || 0} completed`,
      isPositive: true,
      icon: <FiActivity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'stat-revenue',
      title: 'Total Revenue (₹)',
      count: formatINR(revenueSummary.totalPaidAmount),
      trend: 'Realtime verified volume',
      isPositive: true,
      icon: <FiDollarSign className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      color: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    },
  ];

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

      {/* 1. Welcome Section */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-none shadow-xl relative overflow-hidden rounded-[24px]">
        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar
                src={currentUser?.avatar}
                name={currentUser?.name}
                email={currentUser?.email}
                role="admin"
                size="xl"
                shape="rounded"
                className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white/20 shadow-xl"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[11px] font-bold uppercase tracking-wider text-rose-300 backdrop-blur-md">
                <FiShield className="w-3.5 h-3.5" /> Platform Governance Panel
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Welcome back, {currentUser?.name || 'Admin'}! 👋
              </h1>
              {currentUser?.email && (
                <p className="text-xs font-semibold text-rose-300">
                  {currentUser.email}
                </p>
              )}
              <p className="text-xs text-slate-300 max-w-lg">
                Complete system status is healthy. Oversee live database statistics, course governance, instructor approvals, and verified revenue streams.
              </p>
            </div>
          </div>

          {/* Date & Time Widget */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <FiCalendar className="w-4 h-4 text-rose-400" />
              <span>{date || 'Loading date...'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-black text-rose-300 tracking-wider">
              <FiSun className="w-4 h-4 text-amber-400" />
              <span>{time || 'Loading time...'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Statistics Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiPieChart className="w-5 h-5 text-indigo-500" /> Platform Overview & Statistics
          </h2>
          {isLoading && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <FiLoader className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Syncing database...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statsCards.map((stat) => (
            <motion.div
              key={stat.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <Card className={`p-5 rounded-[20px] border shadow-sm ${stat.color} transition-all`}>
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                    {stat.icon}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${stat.isPositive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                  >
                    {stat.isPositive ? <FiTrendingUp className="w-3 h-3" /> : <FiClock className="w-3 h-3" />}
                    <span>{stat.trend}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {stat.count}
                  </h3>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Main Dashboard Content Split: Pending Approvals & Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* Left Column (2 Cols): Pending Course Approvals, Instructors & Students */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pending Course Approvals Section */}
          <Card className="p-6 rounded-[24px] space-y-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <FiClock className="w-5 h-5 text-amber-500" /> Pending Course Approvals
                </h2>
                <p className="text-xs text-slate-500">Inspect curriculum, media, and assessments before catalog release.</p>
              </div>
              <Badge variant={pendingCoursesList.length > 0 ? 'warning' : 'success'}>
                {pendingCoursesList.length} Pending
              </Badge>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {pendingCoursesList.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 border border-dashed border-slate-300 dark:border-slate-700"
                  >
                    <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Governance Queue Empty</p>
                    <p className="text-xs text-slate-500">All submitted courses have been evaluated and processed.</p>
                  </motion.div>
                ) : (
                  pendingCoursesList.map((course) => (
                    <motion.div
                      key={course.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-20 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {course.category} • {formatINR(course.price)}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Avatar
                              src={course.instructorAvatar}
                              name={course.instructorName}
                              role="instructor"
                              size="xs"
                              shape="circle"
                              className="w-4 h-4"
                            />
                            <span>{course.instructorName}</span>
                            <span>•</span>
                            <span className="text-[11px] text-slate-400">{course.submissionDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/admin/courses')}
                          className="text-xs py-1.5 px-3 rounded-xl flex items-center gap-1"
                        >
                          <FiEye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={actionLoadingId === course.id}
                          onClick={() => handleApproveCourse(course.id)}
                          className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          {actionLoadingId === course.id ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={actionLoadingId === course.id}
                          onClick={() => handleRejectCourse(course.id)}
                          className="text-xs py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          {actionLoadingId === course.id ? (
                            <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FiX className="w-3.5 h-3.5" />
                          )}
                          <span>Reject</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Latest Instructors Section */}
          <Card className="p-6 rounded-[24px] space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <FiUserCheck className="w-5 h-5 text-purple-500" /> Latest Instructor Applications
                </h2>
                <p className="text-xs text-slate-500">Review teacher verification status and domain credentials.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/admin/instructors')}>
                View All Instructors
              </Button>
            </div>

            {instructorsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No instructor applications registered yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {instructorsList.map((inst) => (
                  <div key={inst.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={inst.avatar}
                        name={inst.name}
                        email={inst.email}
                        role="instructor"
                        size="md"
                        shape="rounded"
                        className="border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{inst.name}</h4>
                        <p className="text-[11px] text-slate-400">{inst.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={inst.status === 'Approved' ? 'success' : 'warning'}>
                        {inst.status === 'Approved' ? '✓ Approved' : '⏳ Pending'}
                      </Badge>

                      {inst.status === 'Pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === inst.id}
                          onClick={() => handleApproveInstructor(inst.id)}
                          className="text-[11px] py-1 px-2.5 rounded-lg border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        >
                          {actionLoadingId === inst.id ? (
                            <FiLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            'Approve'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Latest Students Section */}
          <Card className="p-6 rounded-[24px] space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-indigo-500" /> Latest Registered Students
                </h2>
                <p className="text-xs text-slate-500">Recent student onboarding and course enrollment counts.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/admin/users')}>
                View Roster
              </Button>
            </div>

            {studentsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No students registered on the platform yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studentsList.map((stud) => (
                  <div
                    key={stud.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3"
                  >
                    <Avatar
                      src={stud.avatar}
                      name={stud.name}
                      email={stud.email}
                      role="student"
                      size="md"
                      shape="rounded"
                    />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{stud.name}</h4>
                      <p className="text-[11px] text-slate-400">{stud.email}</p>
                      <span className="inline-block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                        {stud.enrolledCoursesCount} Enrolled Courses
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* Right Column (1 Col): Revenue Overview, Quick Actions & Notifications */}
        <div className="space-y-6">

          {/* 4. Revenue Overview Card */}
          <Card className="p-6 rounded-[24px] space-y-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5 text-rose-400" /> Revenue Overview (₹)
                </h2>
                <p className="text-xs text-slate-300">Financial stats in Indian Currency (₹)</p>
              </div>
              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-full border border-rose-400/30">
                INR
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-400 font-semibold">Total Platform Volume</p>
                <h3 className="text-2xl font-black text-rose-400 mt-1">
                  {formatINR(revenueSummary.totalPaidAmount)}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[11px] text-slate-400">Monthly Revenue</p>
                  <h4 className="text-sm font-black text-emerald-400 mt-0.5">
                    {formatINR(revenueSummary.monthlyRevenueINR)}
                  </h4>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[11px] text-slate-400">Instructor Payouts</p>
                  <h4 className="text-sm font-black text-indigo-300 mt-0.5">
                    {formatINR(revenueSummary.instructorEarningsINR)}
                  </h4>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-400/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Net Platform Earnings ({(revenueSummary as any)?.platformCommissionPercent ?? 15}%):</span>
                <span className="font-black text-emerald-400 text-sm">
                  {formatINR(revenueSummary.platformEarningsINR)}
                </span>
              </div>
            </div>
          </Card>

          {/* 5. Quick Actions Grid */}
          <Card className="p-6 rounded-[24px] space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Quick Governance Actions
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiUsers className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span>Manage Students</span>
              </button>

              <button
                onClick={() => navigate('/admin/instructors')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiUserCheck className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                <span>Manage Instructors</span>
              </button>

              <button
                onClick={() => navigate('/admin/courses')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiBookOpen className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Review Courses</span>
              </button>

              <button
                onClick={() => navigate('/admin/categories')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiFolderPlus className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <span>Manage Categories</span>
              </button>

              <button
                onClick={() => navigate('/admin/payments')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiCreditCard className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span>View Payments</span>
              </button>

              <button
                onClick={() => navigate('/admin/inquiries')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiMail className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span>Support Messages</span>
              </button>

              <button
                onClick={() => navigate('/admin/analytics')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <FiActivity className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>View Reports</span>
              </button>
            </div>
          </Card>

          {/* 6. System Notifications Feed */}
          <Card className="p-6 rounded-[24px] space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <FiBell className="w-4 h-4 text-rose-500" /> System Notifications
              </h2>
              <span className="text-[10px] font-bold text-slate-400">Live Feed</span>
            </div>

            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No active system alerts.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${!notif.read
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60'
                      }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>{notif.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 7. Recent Activities Feed */}
          <Card className="p-6 rounded-[24px] space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-indigo-500" /> Recent Platform Activities
            </h2>

            {activities.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No recent activity logged yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {activities.map((act) => (
                  <div key={act.id} className="relative space-y-0.5">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{act.title}</h4>
                    <p className="text-[11px] text-slate-500">{act.description}</p>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>
    </motion.div>
  );
};

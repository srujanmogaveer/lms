import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  FiBarChart2,
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiDollarSign,
  FiAward,
  FiCheckCircle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiFileText,
  FiStar,
  FiRotateCcw,
  FiGrid,
  FiRefreshCw
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminService, type AdminDashboardStats, type AdminUserProfile } from '../../services/adminService';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import type {
  OverviewMetrics,
  StudentAnalyticsData,
  InstructorAnalyticsData,
  CourseAnalyticsData,
  RevenueAnalyticsData,
  LearningAnalyticsData
} from '../../data/reportsAnalyticsData';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const AdminReportsAnalytics: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'instructors' | 'courses' | 'revenue' | 'learning'>('overview');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('2026');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Loading & Live Data state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [studentsList, setStudentsList] = useState<AdminUserProfile[]>([]);
  const [instructorsList, setInstructorsList] = useState<AdminUserProfile[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatINR = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const resetFilters = () => {
    setSearchQuery('');
    setMonthFilter('All');
    setYearFilter('2026');
    setCategoryFilter('All');
  };

  // Fetch live metrics from Backend API
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [statsRes, studentsRes, instructorsRes, coursesRes, categoriesRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getStudents({ limit: 300 }),
        adminService.getInstructors({ limit: 300 }),
        courseService.getAdminCourses({ limit: 300 }),
        categoryService.getCategories(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
      if (studentsRes.status === 'fulfilled' && studentsRes.value.success) {
        setStudentsList(Array.isArray(studentsRes.value.data) ? studentsRes.value.data : []);
      }
      if (instructorsRes.status === 'fulfilled' && instructorsRes.value.success) {
        setInstructorsList(Array.isArray(instructorsRes.value.data) ? instructorsRes.value.data : []);
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
        const cData = coursesRes.value.data;
        setCoursesList(Array.isArray(cData) ? cData : (cData as any)?.courses || []);
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        setCategoriesList(Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : []);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  // Compute Dynamic Metrics from Live Data
  const dynamicOverviewMetrics: OverviewMetrics = React.useMemo(() => {
    const totalStudents = stats?.students?.total ?? studentsList.length;
    const totalInstructors = stats?.instructors?.total ?? instructorsList.length;
    const totalCourses = stats?.courses?.total ?? coursesList.length;
    const activeCourses = stats?.courses?.published ?? coursesList.filter((c) => (c.status || c.courseStatus) === 'Published').length;
    const totalRevenueINR = coursesList.reduce((sum, c) => sum + (c.revenueINR || (c.price ? (c.studentsEnrolled || 0) * c.price : 0)), 0);
    const certificatesIssued = studentsList.reduce((sum, s) => sum + (s.certificatesCount || 0), 0);

    return {
      totalStudents,
      totalInstructors,
      totalCourses,
      totalRevenueINR,
      activeCourses,
      certificatesIssued,
    };
  }, [stats, studentsList, instructorsList, coursesList]);

  // Compute Student Analytics
  const dynamicStudentAnalytics: StudentAnalyticsData = React.useMemo(() => {
    const activeStudents = stats?.students?.active ?? studentsList.filter((s) => s.status === 'active').length;
    const inactiveStudents = stats?.students?.inactive ?? studentsList.filter((s) => s.status !== 'active').length;

    // Monthly registrations breakdown
    const monthCounts: Record<string, number> = {};
    MONTH_NAMES.slice(0, 7).forEach((m) => { monthCounts[m] = 0; });
    studentsList.forEach((s) => {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        const m = MONTH_NAMES[d.getMonth()];
        if (monthCounts[m] !== undefined) {
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        }
      }
    });

    const monthlyRegistrations = MONTH_NAMES.slice(0, 7).map((m) => ({
      month: m,
      count: monthCounts[m] || 0,
    }));

    return {
      newRegistrationsMonth: studentsList.length,
      activeStudentsCount: activeStudents,
      courseCompletionRate: 0,
      studentGrowthPercentage: studentsList.length > 0 ? 100 : 0,
      monthlyRegistrations,
      activeVsInactive: [
        { name: 'Active Students', value: Math.max(activeStudents, 0), color: '#10B981' },
        { name: 'Inactive Accounts', value: Math.max(inactiveStudents, 0), color: '#64748B' },
      ],
    };
  }, [stats, studentsList]);

  // Compute Instructor Analytics
  const dynamicInstructorAnalytics: InstructorAnalyticsData = React.useMemo(() => {
    const totalInstructors = stats?.instructors?.total ?? instructorsList.length;
    const approvedInstructors = stats?.instructors?.approved ?? instructorsList.filter((i) => i.instructorApprovalStatus === 'approved').length;
    const pendingApproval = stats?.instructors?.pending ?? instructorsList.filter((i) => i.instructorApprovalStatus === 'pending').length;
    const activeInstructors = stats?.instructors?.active ?? instructorsList.filter((i) => i.status === 'active').length;

    const monthCounts: Record<string, number> = {};
    MONTH_NAMES.slice(0, 7).forEach((m) => { monthCounts[m] = 0; });
    instructorsList.forEach((i) => {
      if (i.createdAt) {
        const d = new Date(i.createdAt);
        const m = MONTH_NAMES[d.getMonth()];
        if (monthCounts[m] !== undefined) {
          monthCounts[m] = (monthCounts[m] || 0) + 1;
        }
      }
    });

    const monthlyRegistrations = MONTH_NAMES.slice(0, 7).map((m) => ({
      month: m,
      count: monthCounts[m] || 0,
    }));

    return {
      totalInstructors,
      approvedInstructors,
      pendingApproval,
      activeInstructors,
      monthlyRegistrations,
    };
  }, [stats, instructorsList]);

  // Compute Course Analytics
  const dynamicCourseAnalytics: CourseAnalyticsData = React.useMemo(() => {
    const totalCourses = stats?.courses?.total ?? coursesList.length;
    const publishedCourses = stats?.courses?.published ?? coursesList.filter((c) => (c.status || c.courseStatus) === 'Published').length;
    const pendingApproval = stats?.courses?.pending ?? coursesList.filter((c) => (c.status || c.courseStatus) === 'Draft' || (c.status || c.courseStatus) === 'Pending').length;

    // Category Distribution
    const catCountMap: Record<string, number> = {};
    coursesList.forEach((c) => {
      const cat = c.category || c.categoryName || 'General';
      catCountMap[cat] = (catCountMap[cat] || 0) + 1;
    });

    const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#14B8A6'];
    const categoryDistribution = Object.entries(catCountMap).map(([name, count], i) => ({
      name,
      count,
      color: colors[i % colors.length],
    }));

    if (categoryDistribution.length === 0) {
      categoryDistribution.push({ name: 'No Courses Yet', count: 1, color: '#94A3B8' });
    }

    const mostPopularCourses = coursesList
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.title,
        instructor: c.instructorName || c.instructor?.name || 'Instructor',
        category: c.category || c.categoryName || 'General',
        students: c.studentsEnrolled || c.total_enrolled || 0,
        rating: Number(c.rating || 5.0),
      }));

    return {
      totalCourses,
      pendingApproval,
      publishedCourses,
      archivedCourses: 0,
      mostPopularCourses,
      categoryDistribution,
      monthlyPublications: MONTH_NAMES.slice(0, 7).map((m) => ({ month: m, count: 0 })),
    };
  }, [stats, coursesList]);

  // Compute Revenue Analytics
  const dynamicRevenueAnalytics: RevenueAnalyticsData = React.useMemo(() => {
    const totalRev = dynamicOverviewMetrics.totalRevenueINR;
    const platformEarningsINR = Math.round(totalRev * 0.15);
    const instructorPayoutsINR = Math.round(totalRev * 0.85);

    const monthlyRevenue = MONTH_NAMES.slice(0, 7).map((m) => ({
      month: m,
      revenue: totalRev > 0 ? Math.round(totalRev / 7) : 0,
      platformShare: totalRev > 0 ? Math.round((totalRev * 0.15) / 7) : 0,
      instructorShare: totalRev > 0 ? Math.round((totalRev * 0.85) / 7) : 0,
    }));

    return {
      dailyRevenueINR: Math.round(totalRev / 30),
      weeklyRevenueINR: Math.round(totalRev / 4),
      monthlyRevenueINR: totalRev,
      yearlyRevenueINR: totalRev,
      platformEarningsINR,
      instructorPayoutsINR,
      monthlyRevenue,
      revenueByCategory: dynamicCourseAnalytics.categoryDistribution.map((c) => ({
        category: c.name,
        amountINR: 0,
      })),
    };
  }, [dynamicOverviewMetrics, dynamicCourseAnalytics]);

  // Compute Learning Analytics
  const dynamicLearningAnalytics: LearningAnalyticsData = React.useMemo(() => {
    return {
      totalLessonsCompleted: 0,
      assignmentCompletionRate: 0,
      quizPassRate: 0,
      certificatesGenerated: dynamicOverviewMetrics.certificatesIssued,
      assignmentCompletion: MONTH_NAMES.slice(0, 7).map((m) => ({ month: m, rate: 0 })),
      quizPerformance: MONTH_NAMES.slice(0, 7).map((m) => ({ month: m, passRate: 0 })),
      certificateGrowth: MONTH_NAMES.slice(0, 7).map((m) => ({ month: m, count: 0 })),
    };
  }, [dynamicOverviewMetrics]);

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
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiBarChart2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Reports & Analytics Intelligence Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide executive metrics, student engagement trends, revenue breakdowns (₹), course category distribution, and learning performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} /> Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast('Exporting PDF Executive Summary Report...')}
            disabled={isLoading}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export PDF
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => showToast('Exporting Excel Raw Data Ledger...')}
            disabled={isLoading}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            <FiFileText className="w-3.5 h-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider px-2">Quick Navigation:</span>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/users')} className="text-xs rounded-xl py-1 px-3">
          <FiUsers className="w-3.5 h-3.5 mr-1 text-indigo-500" /> View Students
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/instructors')} className="text-xs rounded-xl py-1 px-3">
          <FiUserCheck className="w-3.5 h-3.5 mr-1 text-purple-500" /> View Instructors
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/courses')} className="text-xs rounded-xl py-1 px-3">
          <FiBookOpen className="w-3.5 h-3.5 mr-1 text-rose-500" /> View Courses
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/admin/payments')} className="text-xs rounded-xl py-1 px-3">
          <FiDollarSign className="w-3.5 h-3.5 mr-1 text-emerald-500" /> View Payments
        </Button>
      </div>

      {/* 1. Dashboard Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 rounded-[20px] bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-1">
          <FiUsers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Students</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{dynamicOverviewMetrics.totalStudents.toLocaleString()}</h3>
        </Card>

        <Card className="p-4 rounded-[20px] bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-1">
          <FiUserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Instructors</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{dynamicOverviewMetrics.totalInstructors}</h3>
        </Card>

        <Card className="p-4 rounded-[20px] bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-1">
          <FiBookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Courses</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{dynamicOverviewMetrics.totalCourses}</h3>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
          <FiDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Revenue</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{formatINR(dynamicOverviewMetrics.totalRevenueINR)}</h3>
        </Card>

        <Card className="p-4 rounded-[20px] bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-1">
          <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Active Courses</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{dynamicOverviewMetrics.activeCourses}</h3>
        </Card>

        <Card className="p-4 rounded-[20px] bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
          <FiAward className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Certificates Issued</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{dynamicOverviewMetrics.certificatesIssued}</h3>
        </Card>
      </div>

      {/* Toolbar: Search & Multi-Filters */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Course Name, Instructor Name..."
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiFilter className="w-3 h-3" /> Filter Month:
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Months</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiFilter className="w-3 h-3" /> Filter Year:
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiGrid className="w-3 h-3" /> Filter Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              {categoriesList.length > 0 ? (
                categoriesList.map((cat: any) => (
                  <option key={cat.id || cat._id || cat.name} value={cat.name || cat.title}>
                    {cat.name || cat.title}
                  </option>
                ))
              ) : (
                <>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Mobile App">Mobile App</option>
                </>
              )}
            </select>
          </div>
        </div>
      </Card>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs font-sans">
        {[
          { id: 'overview', label: 'Executive Overview', icon: FiBarChart2 },
          { id: 'students', label: 'Student Analytics', icon: FiUsers },
          { id: 'instructors', label: 'Instructor Analytics', icon: FiUserCheck },
          { id: 'courses', label: 'Course Analytics', icon: FiBookOpen },
          { id: 'revenue', label: 'Revenue Analytics (₹)', icon: FiDollarSign },
          { id: 'learning', label: 'Learning & Pass Rates', icon: FiAward },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
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
      {/* SECTION 1: EXECUTIVE OVERVIEW */}
      {/* ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'revenue') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trend Chart */}
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Financial Intelligence</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Monthly Platform Gross Revenue (₹)
                </h3>
              </div>
              <Badge variant="success">YTD Growth +22.4%</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicRevenueAnalytics.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Student Registrations Trend Chart */}
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase">Growth Intelligence</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Monthly Student Registrations
                </h3>
              </div>
              <Badge variant="primary">+14.2% MoM</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicStudentAnalytics.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip formatter={(value: any) => [`${value} Students`, 'Registrations']} />
                  <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: STUDENT ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">New Registrations (This Month)</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{dynamicStudentAnalytics.newRegistrationsMonth}</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Students</span>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{dynamicStudentAnalytics.activeStudentsCount}</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Course Completion Rate</span>
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{dynamicStudentAnalytics.courseCompletionRate}%</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">YoY Student Growth</span>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">+{dynamicStudentAnalytics.studentGrowthPercentage}%</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Monthly Registration Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicStudentAnalytics.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Active vs Inactive Accounts</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dynamicStudentAnalytics.activeVsInactive} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {dynamicStudentAnalytics.activeVsInactive.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: INSTRUCTOR ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Instructors</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{dynamicInstructorAnalytics.totalInstructors}</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Instructors</span>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{dynamicInstructorAnalytics.approvedInstructors}</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Approval</span>
              <h3 className="text-xl font-black text-amber-500">{dynamicInstructorAnalytics.pendingApproval}</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Teaching</span>
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{dynamicInstructorAnalytics.activeInstructors}</h3>
            </Card>
          </div>

          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Monthly Instructor Onboarding</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicInstructorAnalytics.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: COURSE ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Course Category Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dynamicCourseAnalytics.categoryDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {dynamicCourseAnalytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Top Popular Courses */}
            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Top Enrolled Masterclasses</h3>
              <div className="space-y-2.5 text-xs">
                {dynamicCourseAnalytics.mostPopularCourses.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">By {c.instructor} • {c.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm block">{c.students} Students</span>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 justify-end">
                        <FiStar className="w-3 h-3 fill-amber-500" /> {c.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: LEARNING ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Lessons Completed</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{dynamicLearningAnalytics.totalLessonsCompleted.toLocaleString()}</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assignment Completion Rate</span>
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{dynamicLearningAnalytics.assignmentCompletionRate}%</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quiz Pass Rate</span>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{dynamicLearningAnalytics.quizPassRate}%</h3>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Certificates Issued</span>
              <h3 className="text-xl font-black text-amber-500">{dynamicLearningAnalytics.certificatesGenerated}</h3>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Quiz Pass Rate Trend (%)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicLearningAnalytics.quizPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="passRate" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Cumulative Certificate Growth</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicLearningAnalytics.certificateGrowth}>
                    <defs>
                      <linearGradient id="colorCert" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorCert)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REPORTS DOWNLOAD SECTION (PDF / EXCEL UI ONLY) */}
      {/* ======================================================== */}
      <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FiFileText className="w-5 h-5 text-indigo-500" /> Executive Platform Report Exports
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">Student Report</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Full student enrollment breakdown & progress logs.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Student PDF Report...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Student Excel Sheet...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                Excel
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">Instructor Report</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Instructor earnings, course counts, & student engagement.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Instructor PDF Report...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Instructor Excel Sheet...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                Excel
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">Course Report</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Category distribution & course completion analytics.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Course PDF Report...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Course Excel Sheet...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                Excel
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">Revenue Report</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Gross revenue, platform commission, & payout ledgers.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Revenue PDF Report...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => showToast('Exporting Revenue Excel Sheet...')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                Excel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

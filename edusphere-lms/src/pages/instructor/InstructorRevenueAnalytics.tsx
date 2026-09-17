import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiBookOpen,
  FiAward,
  FiCalendar,
  FiSearch,
  FiDownload,
  FiFileText,
  FiStar,
  FiBarChart2,
  FiPieChart,
  FiCheckCircle,
  FiArrowUpRight,
  FiArrowDownRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { InstructorEarningsSection } from '../../components/instructor/InstructorEarningsSection';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';

interface CoursePerformanceItem {
  id: string;
  courseTitle: string;
  studentsEnrolled: number;
  completionRate: number;
  averageRating: number;
  revenue: number;
}

interface MonthlyTrendItem {
  month: string;
  revenue: number;
  enrollments: number;
}

interface InstructorAnalyticsState {
  overview: {
    totalRevenue: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    averageRevenuePerCourse: number;
    growthPercentage: number;
    totalCourses: number;
    totalStudents: number;
    totalEnrollments: number;
    newEnrollments: number;
    activeStudents: number;
    completedStudents: number;
  };
  studentPerformance: {
    averageQuizScore: number;
    assignmentCompletionRate: number;
    overallCourseCompletionRate: number;
  };
  monthlyTrends: MonthlyTrendItem[];
  coursePerformance: CoursePerformanceItem[];
  instructorCourses: { id: string; title: string }[];
}


const defaultAnalyticsState: InstructorAnalyticsState = {
  overview: {
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    averageRevenuePerCourse: 0,
    growthPercentage: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    newEnrollments: 0,
    activeStudents: 0,
    completedStudents: 0,
  },
  studentPerformance: {
    averageQuizScore: 0,
    assignmentCompletionRate: 0,
    overallCourseCompletionRate: 0,
  },
  monthlyTrends: [],
  coursePerformance: [],
  instructorCourses: [],
};

export const InstructorRevenueAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, rawProfile } = useAuth();

  // Loading & Analytics Data State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<InstructorAnalyticsState>(defaultAnalyticsState);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('All');

  // Interactive Toast State
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Indian Rupee (₹) Currency Formatter with Indian Numbering System
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch real analytics from backend
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await paymentService.getInstructorAnalytics();
      if (res && res.success && res.data) {
        const newData: InstructorAnalyticsState = {
          overview: {
            totalRevenue: res.data.overview?.totalRevenue || 0,
            monthlyRevenue: res.data.overview?.monthlyRevenue || 0,
            weeklyRevenue: res.data.overview?.weeklyRevenue || 0,
            averageRevenuePerCourse: res.data.overview?.averageRevenuePerCourse || 0,
            growthPercentage: res.data.overview?.growthPercentage || 0,
            totalCourses: res.data.overview?.totalCourses || 0,
            totalStudents: res.data.overview?.totalStudents || 0,
            totalEnrollments: res.data.overview?.totalEnrollments || 0,
            newEnrollments: res.data.overview?.newEnrollments || 0,
            activeStudents: res.data.overview?.activeStudents || 0,
            completedStudents: res.data.overview?.completedStudents || 0,
          },
          studentPerformance: {
            averageQuizScore: res.data.studentPerformance?.averageQuizScore || 0,
            assignmentCompletionRate: res.data.studentPerformance?.assignmentCompletionRate || 0,
            overallCourseCompletionRate: res.data.studentPerformance?.overallCourseCompletionRate || 0,
          },
          monthlyTrends: Array.isArray(res.data.monthlyTrends) ? res.data.monthlyTrends : [],
          coursePerformance: Array.isArray(res.data.coursePerformance) ? res.data.coursePerformance : [],
          instructorCourses: Array.isArray(res.data.instructorCourses) ? res.data.instructorCourses : [],
        };
        setData(newData);
      }
    } catch {
      // Keep existing cached data — do not reset to zeros on network error
      showToast('Unable to load revenue analytics.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filtered Course Performance List
  const filteredCourses = useMemo(() => {
    return (data?.coursePerformance ?? []).filter((course) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === '' || course.courseTitle.toLowerCase().includes(q);
      const matchesCourse = selectedCourseFilter === 'All' || course.id === selectedCourseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [data?.coursePerformance, searchQuery, selectedCourseFilter]);

  // Current Month & Date details for accurate labels
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, []);

  // Chart Max Revenue scaling
  const maxTrendRevenue = useMemo(() => {
    const maxVal = Math.max(...(data?.monthlyTrends ?? []).map((t) => t.revenue), 1000);
    return Math.max(maxVal, 10000);
  }, [data?.monthlyTrends]);

  // Peak and Lowest Month computations
  const { peakMonth, lowestMonth } = useMemo(() => {
    if (!data?.monthlyTrends?.length) return { peakMonth: null, lowestMonth: null };
    const sorted = [...data.monthlyTrends].sort((a, b) => b.revenue - a.revenue);
    return {
      peakMonth: sorted[0],
      lowestMonth: sorted[sorted.length - 1],
    };
  }, [data?.monthlyTrends]);

  // Top Performing Courses for Chart (Top 3)
  const topCourses = useMemo(() => {
    return (data?.coursePerformance ?? []).slice(0, 3);
  }, [data?.coursePerformance]);

  const maxTopCourseRevenue = useMemo(() => {
    const maxVal = Math.max(...topCourses.map((c) => c.revenue), 1000);
    return Math.max(maxVal, 5000);
  }, [topCourses]);

  // Real Excel (CSV) Exporter
  const exportToExcel = (customTitle?: string) => {
    if (!data) return;
    const instructorName = currentUser?.name || rawProfile?.fullName || 'Instructor';
    const instructorEmail = currentUser?.email || rawProfile?.email || '';
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const lines: string[] = [];

    // Title & Metadata
    lines.push(`"EDUSPHERE LMS - INSTRUCTOR REVENUE & ANALYTICS REPORT"`);
    lines.push(`"Instructor:","${instructorName}"`);
    lines.push(`"Email:","${instructorEmail}"`);
    lines.push(`"Generated On:","${dateStr}"`);
    lines.push(`"Currency:","INR (₹)"`);
    lines.push(``);

    // Financial & Overview Summary
    lines.push(`"--- FINANCIAL & OVERVIEW SUMMARY ---"`);
    lines.push(`"Metric","Value"`);
    lines.push(`"Total Gross Revenue (₹)","₹${data.overview.totalRevenue.toLocaleString('en-IN')}"`);
    lines.push(`"Monthly Revenue (₹)","₹${data.overview.monthlyRevenue.toLocaleString('en-IN')}"`);
    lines.push(`"Weekly Revenue (₹)","₹${data.overview.weeklyRevenue.toLocaleString('en-IN')}"`);
    lines.push(`"Avg Revenue Per Course (₹)","₹${data.overview.averageRevenuePerCourse.toLocaleString('en-IN')}"`);
    lines.push(`"Growth Rate (%)","${data.overview.growthPercentage}%"`);
    lines.push(`"Total Published Courses","${data.overview.totalCourses}"`);
    lines.push(`"Total Enrolled Students","${data.overview.totalStudents}"`);
    lines.push(`"Active Students","${data.overview.activeStudents}"`);
    lines.push(`"Course Completion Rate (%)","${data.studentPerformance.overallCourseCompletionRate}%"`);
    lines.push(`"Avg Quiz Score (%)","${data.studentPerformance.averageQuizScore}%"`);
    lines.push(`"Assignment Completion Rate (%)","${data.studentPerformance.assignmentCompletionRate}%"`);
    lines.push(``);

    // Monthly Revenue Trends
    if (data.monthlyTrends && data.monthlyTrends.length > 0) {
      lines.push(`"--- MONTHLY REVENUE & ENROLLMENT TRENDS ---"`);
      lines.push(`"Month","Revenue (₹)","Enrollments"`);
      data.monthlyTrends.forEach((m) => {
        lines.push(`"${m.month}","₹${m.revenue.toLocaleString('en-IN')}","${m.enrollments}"`);
      });
      lines.push(``);
    }

    // Course Performance Table
    lines.push(`"--- INDIVIDUAL COURSE PERFORMANCE ---"`);
    lines.push(`"Course Name","Enrolled Students","Completion Rate (%)","Avg Rating (out of 5)","Total Gross Revenue (₹)"`);
    (data.coursePerformance || []).forEach((c) => {
      lines.push(
        `"${c.courseTitle.replace(/"/g, '""')}","${c.studentsEnrolled}","${c.completionRate}%","${c.averageRating.toFixed(1)}","₹${c.revenue.toLocaleString('en-IN')}"`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `EduSphere_Revenue_Analytics_${(customTitle || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Excel/CSV report exported and downloaded successfully!', 'success');
  };

  // Real PDF Exporter (Printable Document Statement)
  const exportToPDF = (customTitle?: string) => {
    if (!data) return;
    const instructorName = currentUser?.name || rawProfile?.fullName || 'Instructor';
    const instructorEmail = currentUser?.email || rawProfile?.email || '';
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const reportTitle = customTitle ? `${customTitle} Report` : 'Instructor Revenue & Analytics Statement';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to export the PDF report', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle} - EduSphere</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body { padding: 32px; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
          .brand span { color: #0f172a; }
          .doc-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .meta-info { text-align: right; font-size: 11px; color: #64748b; }
          .meta-info strong { color: #1e293b; }
          .grid-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .summary-card { padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
          .summary-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .summary-card .value { font-size: 18px; font-weight: 800; color: #0f172a; }
          .summary-card .value.green { color: #059669; }
          .summary-card .value.purple { color: #7c3aed; }
          h2 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 20px 0 8px 0; border-left: 4px solid #7c3aed; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; padding: 10px 12px; border: 1px solid #cbd5e1; text-align: left; }
          td { padding: 9px 12px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #fafafa; }
          .text-right { text-align: right; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
          @media print {
            body { padding: 16px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">EduSphere <span>LMS</span></div>
            <div class="doc-title">${reportTitle}</div>
          </div>
          <div class="meta-info">
            <p><strong>Instructor:</strong> ${instructorName}</p>
            <p><strong>Email:</strong> ${instructorEmail}</p>
            <p><strong>Generated Date:</strong> ${dateStr}</p>
            <p><strong>Currency:</strong> INR (₹)</p>
          </div>
        </div>

        <div class="grid-summary">
          <div class="summary-card">
            <div class="label">Total Gross Revenue</div>
            <div class="value green">₹${data.overview.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-card">
            <div class="label">Monthly Revenue</div>
            <div class="value purple">₹${data.overview.monthlyRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Enrollments</div>
            <div class="value">${data.overview.totalStudents}</div>
          </div>
          <div class="summary-card">
            <div class="label">Course Completion</div>
            <div class="value">${data.studentPerformance.overallCourseCompletionRate}%</div>
          </div>
        </div>

        <h2>Course Performance & Earnings Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Course Name</th>
              <th class="text-right">Students</th>
              <th class="text-right">Completion</th>
              <th class="text-right">Rating</th>
              <th class="text-right">Gross Revenue (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(data.coursePerformance || [])
              .map(
                (c) => `
              <tr>
                <td style="font-weight:600;">${c.courseTitle}</td>
                <td class="text-right">${c.studentsEnrolled}</td>
                <td class="text-right">${c.completionRate}%</td>
                <td class="text-right">${c.averageRating.toFixed(1)} / 5.0</td>
                <td class="text-right" style="font-weight:700; color:#059669;">₹${c.revenue.toLocaleString('en-IN')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        ${
          data.monthlyTrends && data.monthlyTrends.length > 0
            ? `
          <h2>Monthly Performance History</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th class="text-right">Enrollments</th>
                <th class="text-right">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${data.monthlyTrends
                .map(
                  (m) => `
                <tr>
                  <td style="font-weight:600;">${m.month}</td>
                  <td class="text-right">${m.enrollments}</td>
                  <td class="text-right" style="font-weight:700; color:#059669;">₹${m.revenue.toLocaleString('en-IN')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        <div class="footer">
          <span>Confidential &bull; Generated by EduSphere Learning Management System</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast('Opening PDF Print Preview...', 'success');
  };

  // Handle Export Action
  const handleExportReport = (format: 'PDF' | 'Excel', customTitle?: string) => {
    if (format === 'PDF') {
      exportToPDF(customTitle);
    } else {
      exportToExcel(customTitle);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2"
          >
            <FiCheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Revenue & Analytics
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live financial metrics, student enrollment trends, course ratings, and completion analytics formatted in Indian Rupees (₹).
            </p>
          </div>
        </div>

        {/* Quick Actions Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportReport('PDF')}
            className="flex items-center gap-1.5 text-xs font-bold border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Download PDF Financial Report"
          >
            <FiDownload className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportReport('Excel')}
            className="flex items-center gap-1.5 text-xs font-bold border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            title="Download Excel / CSV SpreadSheet"
          >
            <FiDownload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/instructor/courses')}
            className="flex items-center gap-1 text-xs"
          >
            <FiBookOpen className="w-3.5 h-3.5" /> View Courses
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/instructor/students')}
            className="flex items-center gap-1 text-xs"
          >
            <FiUsers className="w-3.5 h-3.5" /> View Students
          </Button>
        </div>
      </div>

      {/* INSTRUCTOR EARNINGS & PAYOUT HISTORY SECTION */}
      <InstructorEarningsSection />

      {/* When data is null (first load, no cache), show skeletons instead of false zeros */}
      {(isLoading && data === null) ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
            <div className="lg:col-span-6 h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
          </div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
        </div>
      ) : data ? (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <Card className="p-5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl space-y-2 shadow-md">
          <div className="flex items-center justify-between text-purple-200 text-xs font-bold">
            <span>TOTAL REVENUE</span>
            <span className="p-2 bg-white/10 rounded-xl">
              <FiTrendingUp className="w-4 h-4 text-white" />
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight">
            {formatINR(data.overview.totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold pt-1">
            {data.overview.growthPercentage >= 0 ? (
              <>
                <FiArrowUpRight className="w-3.5 h-3.5" /> +{data.overview.growthPercentage}% vs last month
              </>
            ) : (
              <>
                <FiArrowDownRight className="w-3.5 h-3.5 text-rose-300" /> {data.overview.growthPercentage}% vs last month
              </>
            )}
          </div>
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>MONTHLY REVENUE</span>
            <span className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
              <FiCalendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatINR(data.overview.monthlyRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{currentMonthName} Earnings</div>
        </Card>

        {/* Weekly Revenue Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>WEEKLY REVENUE</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <FiDollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatINR(data.overview.weeklyRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Last 7 Days Earnings</div>
        </Card>

        {/* Average Revenue Per Course Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>AVG REVENUE / COURSE</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <FiBarChart2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatINR(data.overview.averageRevenuePerCourse)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {data.overview.totalCourses} Published {data.overview.totalCourses === 1 ? 'Course' : 'Courses'}
          </div>
        </Card>
      </div>

      {/* ENROLLMENT ANALYTICS & STUDENT PERFORMANCE OVERVIEW CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Enrollment Analytics */}
        <Card className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-purple-600" />
            Enrollment Analytics
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Enrollments
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block">
                {data.overview.totalEnrollments}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Lifetime Enrolled Students</span>
            </div>

            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-1">
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider block">
                New Enrollments (Month)
              </span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block">
                +{data.overview.newEnrollments}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                Joined in {currentMonthName}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-1">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                Active Students
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                {data.overview.activeStudents}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-medium">
                Active in last 30 days
              </span>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-1">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider block">
                Completed Students
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block">
                {data.overview.completedStudents}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">
                Finished 100% Curriculum
              </span>
            </div>
          </div>
        </Card>

        {/* Right 6 Cols: Student Performance Summary */}
        <Card className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiAward className="w-4 h-4 text-purple-600" />
            Student Performance Summary
          </h3>

          <div className="space-y-4 text-xs">
            {/* Average Quiz Score */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">Average Quiz Score</span>
                <span className="text-purple-600 dark:text-purple-400 font-extrabold">
                  {data.studentPerformance.averageQuizScore}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, data.studentPerformance.averageQuizScore)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-purple-600 rounded-full"
                />
              </div>
            </div>

            {/* Assignment Completion Rate */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">Assignment Completion Rate</span>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                  {data.studentPerformance.assignmentCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, data.studentPerformance.assignmentCompletionRate)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            {/* Overall Course Completion Rate */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">Overall Course Completion Rate</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {data.studentPerformance.overallCourseCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, data.studentPerformance.overallCourseCompletionRate)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* VISUAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Trend (8 Cols) */}
        <Card className="lg:col-span-8 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FiBarChart2 className="w-4 h-4 text-purple-600" />
              Monthly Revenue Trend (₹ INR)
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {data.monthlyTrends.length > 0
                ? `${data.monthlyTrends[0].month} - ${data.monthlyTrends[data.monthlyTrends.length - 1].month}`
                : 'Last 6 Months'}
            </span>
          </div>

          {/* Bar Chart Visualization */}
          {data.monthlyTrends.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              No revenue trend data recorded yet.
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              {data.monthlyTrends.map((trend) => {
                const heightPercent = Math.max(6, (trend.revenue / maxTrendRevenue) * 100);
                return (
                  <div key={trend.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatINR(trend.revenue)}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.8 }}
                      className="w-full max-w-[48px] bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-xl group-hover:brightness-110 transition-all cursor-pointer shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {trend.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Lowest Month:{' '}
              {lowestMonth ? `${formatINR(lowestMonth.revenue)} (${lowestMonth.month.split(' ')[0]})` : '₹0'}
            </span>
            <span className="font-bold text-purple-600">
              Peak Month:{' '}
              {peakMonth ? `${formatINR(peakMonth.revenue)} (${peakMonth.month.split(' ')[0]})` : '₹0'}
            </span>
          </div>
        </Card>

        {/* Top Performing Courses Chart (4 Cols) */}
        <Card className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiPieChart className="w-4 h-4 text-purple-600" />
            Top Performing Courses
          </h3>

          {topCourses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No course sales recorded yet.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {topCourses.map((course, idx) => (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {idx + 1}. {course.courseTitle}
                    </span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      {formatINR(course.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (course.revenue / maxTopCourseRevenue) * 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-purple-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* COURSE PERFORMANCE BREAKDOWN TABLE */}
      <div className="space-y-4">
        {/* Search & Filters Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Course Name for Analytics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
            >
              <option value="All">All Courses</option>
              {data.instructorCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
            >
              <option value="All">All Periods</option>
              {data.monthlyTrends.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 bg-white dark:bg-slate-900">
            <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600">
              <FiBarChart2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No course performance analytics available.
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {data.instructorCourses.length === 0
                  ? 'You have not created any courses yet. Create and publish courses to view analytics.'
                  : 'There are no courses matching your search parameters.'}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Course Name</th>
                  <th className="p-4">Enrolled Students</th>
                  <th className="p-4">Completion Rate</th>
                  <th className="p-4">Avg Rating</th>
                  <th className="p-4 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 max-w-md">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {c.courseTitle}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {c.studentsEnrolled} Students
                    </td>
                    <td className="p-4 w-40">
                      <div className="space-y-1">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {c.completionRate}%
                        </span>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${Math.min(100, c.completionRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-amber-500 flex items-center gap-1">
                      <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {c.averageRating.toFixed(1)} / 5.0
                    </td>
                    <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatINR(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* REPORTS & EXPORT SECTION */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-purple-600" />
              Instructor Financial Reports
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export comprehensive financial statements, enrollment summaries, and course performance reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('PDF')}
              className="flex items-center gap-1 text-xs"
            >
              <FiDownload className="w-3.5 h-3.5 text-rose-500" /> Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportReport('Excel')}
              className="flex items-center gap-1 text-xs"
            >
              <FiDownload className="w-3.5 h-3.5 text-emerald-500" /> Export Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Revenue Summary</span>
              <p className="text-slate-500 text-[11px]">Monthly gross revenue breakdown, earnings, and financial totals.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleExportReport('PDF', 'Revenue Summary')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-bold hover:bg-rose-100 flex items-center gap-1"
              >
                <FiDownload className="w-3 h-3" /> PDF
              </button>
              <button
                onClick={() => handleExportReport('Excel', 'Revenue Summary')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1"
              >
                <FiDownload className="w-3 h-3" /> Excel
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Enrollment Summary</span>
              <p className="text-slate-500 text-[11px]">Student enrollment distribution, active learners, and growth rates.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleExportReport('PDF', 'Enrollment Summary')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-bold hover:bg-rose-100 flex items-center gap-1"
              >
                <FiDownload className="w-3 h-3" /> PDF
              </button>
              <button
                onClick={() => handleExportReport('Excel', 'Enrollment Summary')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1"
              >
                <FiDownload className="w-3 h-3" /> Excel
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Course Summary</span>
              <p className="text-slate-500 text-[11px]">Completion rates, student ratings, and per-course revenue benchmarks.</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleExportReport('PDF', 'Course Performance')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-bold hover:bg-rose-100 flex items-center gap-1"
              >
                <FiDownload className="w-3 h-3" /> PDF
              </button>
              <button
                onClick={() => handleExportReport('Excel', 'Course Performance')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1"
              >
                <FiDownload className="w-3 h-3" /> Excel
              </button>
            </div>
          </div>
        </div>
      </Card>
      </>
      ) : null}
    </div>
  );
};

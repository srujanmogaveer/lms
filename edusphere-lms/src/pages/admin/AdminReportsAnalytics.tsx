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
import { paymentService } from '../../services/paymentService';
import type {
  OverviewMetrics,
  StudentAnalyticsData,
  InstructorAnalyticsData,
  CourseAnalyticsData,
  RevenueAnalyticsData
} from '../../data/reportsAnalyticsData';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AdminReportsAnalytics: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'instructors' | 'courses' | 'revenue'>('overview');
  const [revenueMetricView, setRevenueMetricView] = useState<'platform' | 'gross' | 'both'>('platform');

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
  const [paymentsData, setPaymentsData] = useState<any>(null);

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

  const [certificatesCount, setCertificatesCount] = useState<number>(0);
  const [certificatesList, setCertificatesList] = useState<any[]>([]);

  // Fetch live metrics from Backend API
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [statsRes, studentsRes, instructorsRes, coursesRes, categoriesRes, paymentsRes, certsRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getStudents({ limit: 300 }),
        adminService.getInstructors({ limit: 300 }),
        courseService.getAdminCourses({ limit: 300, approvalStatus: 'All' }),
        categoryService.getCategories(),
        paymentService.getAdminPayments(),
        adminService.getCertificates(),
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
        const list = Array.isArray(cData) ? cData : (cData as any)?.courses || [];
        setCoursesList(list);
      } else {
        setCoursesList([]);
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.success) {
        setCategoriesList(Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : []);
      }
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.success && paymentsRes.value.data) {
        setPaymentsData(paymentsRes.value.data);
      }
      if (certsRes.status === 'fulfilled' && certsRes.value.success && certsRes.value.data) {
        const certs = certsRes.value.data.certificates || [];
        setCertificatesList(Array.isArray(certs) ? certs : []);
        const count = certsRes.value.data.metrics?.certificatesIssued ?? certs.length;
        setCertificatesCount(count);
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

  // Filtered Datasets based on Active Search & Category / Month / Year Filters
  const filteredCourses = React.useMemo(() => {
    return coursesList.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.instructorName && c.instructorName.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(q));

      const cat = c.category || c.categoryName || 'General';
      const matchesCategory = categoryFilter === 'All' || cat.toLowerCase() === categoryFilter.toLowerCase();

      const createdDate = c.createdAt || c.created_at || c.updatedAt;
      let matchesMonth = true;
      let matchesYear = true;
      if (createdDate) {
        let d = new Date(createdDate);
        if (isNaN(d.getTime()) && typeof createdDate === 'string' && createdDate.includes('/')) {
          const parts = createdDate.split('/');
          if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (!isNaN(d.getTime())) {
          if (monthFilter !== 'All') {
            matchesMonth = MONTH_NAMES[d.getMonth()] === monthFilter;
          }
          if (yearFilter !== 'All') {
            matchesYear = d.getFullYear().toString() === yearFilter;
          }
        }
      }

      return matchesSearch && matchesCategory && matchesMonth && matchesYear;
    });
  }, [coursesList, searchQuery, categoryFilter, monthFilter, yearFilter]);

  const filteredStudents = React.useMemo(() => {
    return studentsList.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.studentIdNumber && s.studentIdNumber.toLowerCase().includes(q));

      const createdDate = s.createdAt || (s as any).created_at;
      let matchesMonth = true;
      let matchesYear = true;
      if (createdDate) {
        let d = new Date(createdDate);
        if (isNaN(d.getTime()) && typeof createdDate === 'string' && createdDate.includes('/')) {
          const parts = createdDate.split('/');
          if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (!isNaN(d.getTime())) {
          if (monthFilter !== 'All') {
            matchesMonth = MONTH_NAMES[d.getMonth()] === monthFilter;
          }
          if (yearFilter !== 'All') {
            matchesYear = d.getFullYear().toString() === yearFilter;
          }
        }
      }

      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [studentsList, searchQuery, monthFilter, yearFilter]);

  const filteredInstructors = React.useMemo(() => {
    return instructorsList.filter((i) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (i.fullName && i.fullName.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.specialization && i.specialization.toLowerCase().includes(q));

      const createdDate = i.createdAt || (i as any).created_at;
      let matchesMonth = true;
      let matchesYear = true;
      if (createdDate) {
        let d = new Date(createdDate);
        if (isNaN(d.getTime()) && typeof createdDate === 'string' && createdDate.includes('/')) {
          const parts = createdDate.split('/');
          if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (!isNaN(d.getTime())) {
          if (monthFilter !== 'All') {
            matchesMonth = MONTH_NAMES[d.getMonth()] === monthFilter;
          }
          if (yearFilter !== 'All') {
            matchesYear = d.getFullYear().toString() === yearFilter;
          }
        }
      }

      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [instructorsList, searchQuery, monthFilter, yearFilter]);

  const filteredCertificates = React.useMemo(() => {
    return certificatesList.filter((cert) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (cert.certificateNumber && cert.certificateNumber.toLowerCase().includes(q)) ||
        (cert.certificateCode && cert.certificateCode.toLowerCase().includes(q)) ||
        (cert.studentName && cert.studentName.toLowerCase().includes(q)) ||
        (cert.courseName && cert.courseName.toLowerCase().includes(q)) ||
        (cert.instructorName && cert.instructorName.toLowerCase().includes(q));

      const matchesCat =
        categoryFilter === 'All' ||
        (cert.category && cert.category.toLowerCase() === categoryFilter.toLowerCase());

      const dateStr = cert.issueDate || cert.completionDate;
      let matchesMonth = true;
      let matchesYear = true;
      if (dateStr) {
        let d = new Date(dateStr);
        if (isNaN(d.getTime()) && typeof dateStr === 'string' && dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (!isNaN(d.getTime())) {
          if (monthFilter !== 'All') {
            matchesMonth = MONTH_NAMES[d.getMonth()] === monthFilter;
          }
          if (yearFilter !== 'All') {
            matchesYear = d.getFullYear().toString() === yearFilter;
          }
        }
      }

      return matchesSearch && matchesCat && matchesMonth && matchesYear;
    });
  }, [certificatesList, searchQuery, categoryFilter, monthFilter, yearFilter]);

  // Compute Dynamic Metrics from Live Data (with active filter responsiveness)
  const isFiltering = searchQuery.trim() !== '' || monthFilter !== 'All' || yearFilter !== 'All' || categoryFilter !== 'All';

  // Compute Course Analytics first for category distribution dependencies
  const dynamicCourseAnalytics: CourseAnalyticsData = React.useMemo(() => {
    const totalCourses = filteredCourses.length;
    const publishedCourses = filteredCourses.filter((c) => (c.status || c.courseStatus) === 'Published' || c.isPublished).length;
    const pendingApproval = filteredCourses.filter((c) => (c.status || c.courseStatus) === 'Draft' || (c.status || c.courseStatus) === 'Pending' || c.approvalStatus === 'Pending Approval').length;
    const archivedCourses = filteredCourses.filter((c) => (c.status || c.courseStatus) === 'Archived').length;

    const totalRevenueINR = filteredCourses.reduce(
      (sum, c) => sum + (c.revenueINR || (c.price ? (c.studentsEnrolled || c.total_enrolled || 0) * (c.discountPrice ?? c.price) : 0)),
      0
    );

    const totalStudentsEnrolled = filteredCourses.reduce(
      (sum, c) => sum + (c.studentsEnrolled || c.total_enrolled || 0),
      0
    );

    const ratedCourses = filteredCourses.filter((c) => c.rating && Number(c.rating) > 0);
    const averageRating =
      ratedCourses.length > 0
        ? (ratedCourses.reduce((sum, c) => sum + Number(c.rating), 0) / ratedCourses.length).toFixed(1)
        : '5.0';

    // Category Distribution
    const catCountMap: Record<string, number> = {};
    filteredCourses.forEach((c) => {
      const cat = c.category || c.categoryName || 'General';
      catCountMap[cat] = (catCountMap[cat] || 0) + 1;
    });

    const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#14B8A6', '#06B6D4'];
    const categoryDistribution = Object.entries(catCountMap).map(([name, count], i) => ({
      name,
      count,
      color: colors[i % colors.length],
    }));

    if (categoryDistribution.length === 0) {
      categoryDistribution.push({ name: 'No Courses', count: 0, color: '#94A3B8' });
    }

    const mostPopularCourses = [...filteredCourses]
      .sort((a, b) => (b.studentsEnrolled || b.total_enrolled || 0) - (a.studentsEnrolled || a.total_enrolled || 0))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.title,
        instructor: c.instructorName || c.instructor?.name || 'Instructor',
        category: c.category || c.categoryName || 'General',
        students: c.studentsEnrolled || c.total_enrolled || 0,
        rating: Number(c.rating || 5.0),
      }));

    const courseMonthCounts: Record<string, number> = {};
    MONTH_NAMES.forEach((m) => { courseMonthCounts[m] = 0; });
    filteredCourses.forEach((c) => {
      const createdDate = c.createdAt || c.created_at || c.updatedAt;
      if (createdDate) {
        let d = new Date(createdDate);
        if (isNaN(d.getTime()) && typeof createdDate === 'string' && createdDate.includes('/')) {
          const parts = createdDate.split('/');
          if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
        if (!isNaN(d.getTime())) {
          const m = MONTH_NAMES[d.getMonth()];
          if (courseMonthCounts[m] !== undefined) {
            courseMonthCounts[m] = (courseMonthCounts[m] || 0) + 1;
          }
        }
      }
    });

    const monthlyPublications = MONTH_NAMES.map((m) => ({ month: m, count: courseMonthCounts[m] || 0 }));

    return {
      totalCourses,
      pendingApproval,
      publishedCourses,
      archivedCourses,
      totalRevenueINR,
      totalStudentsEnrolled,
      averageRating,
      mostPopularCourses,
      categoryDistribution,
      monthlyPublications,
    };
  }, [filteredCourses]);

  // Compute Revenue Analytics (Complete 12-Month Jan-Dec & Filter Responsive)
  const dynamicRevenueAnalytics: RevenueAnalyticsData = React.useMemo(() => {
    // Filter live payment records according to active search, category, month, and year
    const filteredPayments = (paymentsData?.payments || []).filter((p: any) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (p.courseName && p.courseName.toLowerCase().includes(q)) ||
        (p.studentName && p.studentName.toLowerCase().includes(q)) ||
        (p.orderNumber && p.orderNumber.toLowerCase().includes(q));

      let matchesCategory = true;
      if (categoryFilter !== 'All') {
        const course = coursesList.find((c) => c.id === p.courseId || c.title === p.courseName);
        const cat = course?.category || course?.categoryName || p.category || '';
        matchesCategory = cat.toLowerCase() === categoryFilter.toLowerCase();
      }

      let matchesMonth = true;
      let matchesYear = true;
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getTime())) {
          if (monthFilter !== 'All') {
            matchesMonth = MONTH_NAMES[d.getMonth()] === monthFilter;
          }
          if (yearFilter !== 'All') {
            matchesYear = d.getFullYear().toString() === yearFilter;
          }
        }
      }

      return matchesSearch && matchesCategory && matchesMonth && matchesYear;
    });

    // Group filtered payments by month across all 12 months
    const monthMap: Record<string, { total: number; platform: number; instructor: number }> = {};
    MONTH_NAMES.forEach((m) => {
      monthMap[m] = { total: 0, platform: 0, instructor: 0 };
    });

    filteredPayments.forEach((p: any) => {
      if (p.createdAt && (p.status === 'Success' || p.status === 'Completed')) {
        const d = new Date(p.createdAt);
        const m = MONTH_NAMES[d.getMonth()];
        if (monthMap[m]) {
          const amt = Number(p.amount || 0);
          monthMap[m].total += amt;
          monthMap[m].platform += Math.round(amt * 0.15);
          monthMap[m].instructor += Math.round(amt * 0.85);
        }
      }
    });

    const totalRev = isFiltering
      ? filteredPayments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0)
      : (paymentsData?.summary?.totalPaidAmount ?? (coursesList.reduce((sum: number, c: any) => sum + (c.revenueINR || (c.price ? (c.studentsEnrolled || 0) * c.price : 0)), 0)));

    const platformEarningsINR = paymentsData?.summary?.platformEarningsINR ?? Math.round(totalRev * 0.15);
    const instructorPayoutsINR = paymentsData?.summary?.instructorEarningsINR ?? Math.round(totalRev * 0.85);

    const monthlyRevenue = MONTH_NAMES.map((m) => {
      const d = monthMap[m];
      return {
        month: m,
        revenue: d.total,
        platformShare: d.platform,
        instructorShare: d.instructor,
      };
    });

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
        amountINR: filteredCourses
          .filter((crs) => (crs.category || crs.categoryName || 'General') === c.name)
          .reduce((acc, crs) => acc + (crs.revenueINR || (crs.price ? (crs.studentsEnrolled || 0) * (crs.discountPrice ?? crs.price) : 0)), 0),
      })),
    };
  }, [dynamicCourseAnalytics, paymentsData, filteredCourses, coursesList, searchQuery, categoryFilter, monthFilter, yearFilter, isFiltering]);

  const dynamicOverviewMetrics: OverviewMetrics = React.useMemo(() => {
    const totalStudents = isFiltering ? filteredStudents.length : (stats?.students?.total ?? studentsList.length);
    const totalInstructors = isFiltering ? filteredInstructors.length : (stats?.instructors?.total ?? instructorsList.length);
    const totalCourses = isFiltering ? filteredCourses.length : (stats?.courses?.total ?? coursesList.length);
    const activeCourses = filteredCourses.filter((c) => (c.status || c.courseStatus) === 'Published').length;
    const totalRevenueINR = dynamicRevenueAnalytics.monthlyRevenueINR;
    const certificatesIssued = isFiltering
      ? filteredCertificates.length
      : (certificatesCount || certificatesList.length || filteredStudents.reduce((sum, s) => sum + (s.certificatesCount || 0), 0) || (stats?.enrollments?.completed || 0));

    return {
      totalStudents,
      totalInstructors,
      totalCourses,
      totalRevenueINR,
      activeCourses,
      certificatesIssued,
    };
  }, [stats, studentsList, instructorsList, coursesList, filteredStudents, filteredInstructors, filteredCourses, dynamicRevenueAnalytics, certificatesCount, certificatesList, filteredCertificates, isFiltering]);

  // Compute Student Analytics (Filter-Responsive)
  const dynamicStudentAnalytics: StudentAnalyticsData = React.useMemo(() => {
    const activeStudents = filteredStudents.filter((s) => s.status === 'active').length;
    const inactiveStudents = filteredStudents.filter((s) => s.status !== 'active').length;

    const totalEnrollments = filteredStudents.reduce((sum, s) => sum + (s.enrolledCoursesCount || 0), 0);
    const completedEnrollments = filteredStudents.reduce((sum, s) => sum + (s.completedCoursesCount || 0), 0);
    const courseCompletionRate = totalEnrollments > 0 ? Math.min(100, Math.round((completedEnrollments / totalEnrollments) * 100)) : 0;

    const now = new Date();
    
    // Monthly registrations breakdown (Jan - Dec) strictly from filteredStudents
    const monthCounts: Record<string, number> = {};
    MONTH_NAMES.forEach((m) => { monthCounts[m] = 0; });
    
    filteredStudents.forEach((s) => {
      const dateStr = s.createdAt || (s as any).created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const m = MONTH_NAMES[d.getMonth()];
          if (monthCounts[m] !== undefined) {
            monthCounts[m] = (monthCounts[m] || 0) + 1;
          }
        } else {
          const currentM = MONTH_NAMES[now.getMonth()];
          if (monthFilter === 'All' || monthFilter === currentM) {
            monthCounts[currentM] = (monthCounts[currentM] || 0) + 1;
          }
        }
      } else {
        const currentM = MONTH_NAMES[now.getMonth()];
        if (monthFilter === 'All' || monthFilter === currentM) {
          monthCounts[currentM] = (monthCounts[currentM] || 0) + 1;
        }
      }
    });

    // If no filter is applied and no dated students found, place known students in current month
    if (!isFiltering && filteredStudents.length > 0 && Object.values(monthCounts).every((c) => c === 0)) {
      const currentM = MONTH_NAMES[now.getMonth()];
      monthCounts[currentM] = filteredStudents.length;
    }

    const thisMonthRegistrations = monthCounts[MONTH_NAMES[now.getMonth()]] || 0;
    const studentGrowthPercentage = filteredStudents.length > 0 ? Math.min(100, Math.round((thisMonthRegistrations / Math.max(1, filteredStudents.length)) * 100)) : 0;

    const monthlyRegistrations = MONTH_NAMES.map((m) => ({
      month: m,
      count: monthCounts[m] || 0,
    }));

    const activeVsInactive = (activeStudents > 0 || inactiveStudents > 0)
      ? [
          { name: 'Active Students', value: Math.max(activeStudents, 0), color: '#10B981' },
          { name: 'Inactive Accounts', value: Math.max(inactiveStudents, 0), color: '#64748B' },
        ]
      : [{ name: 'Active Students', value: 0, color: '#10B981' }];

    return {
      newRegistrationsMonth: thisMonthRegistrations,
      activeStudentsCount: activeStudents,
      courseCompletionRate,
      studentGrowthPercentage,
      monthlyRegistrations,
      activeVsInactive,
    };
  }, [filteredStudents, monthFilter, isFiltering]);

  // Compute Instructor Analytics (Filter-Responsive)
  const dynamicInstructorAnalytics: InstructorAnalyticsData = React.useMemo(() => {
    const totalInstructors = filteredInstructors.length;
    const approvedInstructors = filteredInstructors.filter((i) => i.instructorApprovalStatus === 'approved').length;
    const pendingApproval = filteredInstructors.filter((i) => i.instructorApprovalStatus === 'pending').length;
    const activeInstructors = filteredInstructors.filter((i) => i.status === 'active').length;

    const monthCounts: Record<string, number> = {};
    MONTH_NAMES.forEach((m) => { monthCounts[m] = 0; });
    filteredInstructors.forEach((i) => {
      const dateStr = i.createdAt || (i as any).created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const m = MONTH_NAMES[d.getMonth()];
          if (monthCounts[m] !== undefined) {
            monthCounts[m] = (monthCounts[m] || 0) + 1;
          }
        }
      }
    });

    const monthlyRegistrations = MONTH_NAMES.map((m) => ({
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
  }, [filteredInstructors]);

  // Export handlers
  const exportStudentsCSV = () => {
    downloadCSV(
      `EduSphere_Students_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['Student ID', 'Full Name', 'Email', 'Status', 'Enrolled Courses', 'Completed Courses', 'Certificates', 'Registered Date'],
      studentsList.map((s) => [
        s.studentIdNumber || s.id.slice(0, 8),
        s.fullName,
        s.email,
        s.status,
        s.enrolledCoursesCount || 0,
        s.completedCoursesCount || 0,
        s.certificatesCount || 0,
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'
      ])
    );
    showToast('Student CSV report downloaded successfully!');
  };

  const exportInstructorsCSV = () => {
    downloadCSV(
      `EduSphere_Instructors_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['Instructor ID', 'Full Name', 'Email', 'Specialization', 'Approval Status', 'Account Status', 'Rating', 'Courses Created', 'Registered Date'],
      instructorsList.map((i) => [
        i.studentIdNumber || i.id.slice(0, 8),
        i.fullName,
        i.email,
        i.specialization || i.qualification || 'Education',
        i.instructorApprovalStatus || 'approved',
        i.status,
        i.instructorRating || 5.0,
        i.coursesCreatedCount || 0,
        i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A'
      ])
    );
    showToast('Instructor CSV report downloaded successfully!');
  };

  const exportCoursesCSV = () => {
    downloadCSV(
      `EduSphere_Courses_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['Course ID', 'Title', 'Category', 'Instructor', 'Price (INR)', 'Discount Price', 'Status', 'Students Enrolled', 'Rating'],
      coursesList.map((c) => [
        c.id,
        c.title,
        c.category || c.categoryName || 'General',
        c.instructorName || c.instructor?.name || 'Instructor',
        c.price || 0,
        c.discountPrice || c.discount_price || 0,
        c.status || c.courseStatus || 'Draft',
        c.studentsEnrolled || c.total_enrolled || 0,
        c.rating || 5.0
      ])
    );
    showToast('Course CSV report downloaded successfully!');
  };

  const exportRevenueCSV = () => {
    const pList = paymentsData?.payments || [];
    downloadCSV(
      `EduSphere_Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`,
      ['Payment ID', 'Order Number', 'Student Name', 'Course Name', 'Amount (INR)', 'Payment Method', 'Status', 'Date'],
      pList.map((p: any) => [
        p.id,
        p.orderNumber || p.id.slice(0, 8),
        p.studentName || 'Student',
        p.courseName || 'Course',
        p.amount || 0,
        p.paymentMethod || 'Razorpay',
        p.status || 'Success',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'
      ])
    );
    showToast('Revenue CSV report downloaded successfully!');
  };

  const exportAllExcel = () => {
    downloadCSV(
      `EduSphere_Executive_Ledger_${new Date().toISOString().split('T')[0]}.csv`,
      ['Metric / Dimension', 'Total Value', 'Active Count', 'Secondary Metric'],
      [
        ['Total Platform Revenue (INR)', `₹${dynamicOverviewMetrics.totalRevenueINR.toLocaleString('en-IN')}`, '100%', 'Real database orders'],
        ['Platform Commission (15%)', `₹${(dynamicOverviewMetrics.totalRevenueINR * 0.15).toLocaleString('en-IN')}`, '15%', 'Net platform margin'],
        ['Instructor Earnings (85%)', `₹${(dynamicOverviewMetrics.totalRevenueINR * 0.85).toLocaleString('en-IN')}`, '85%', 'Gross instructor share'],
        ['Total Students Registered', dynamicOverviewMetrics.totalStudents, stats?.students?.active || 0, 'Active accounts'],
        ['Total Instructors', dynamicOverviewMetrics.totalInstructors, stats?.instructors?.approved || 0, 'Approved faculty'],
        ['Total Courses Created', dynamicOverviewMetrics.totalCourses, dynamicOverviewMetrics.activeCourses, 'Published catalog'],
        ['Certificates Issued', dynamicOverviewMetrics.certificatesIssued, '100%', 'Graduated learners']
      ]
    );
    showToast('Executive Raw Data Ledger downloaded successfully!');
  };

  const exportPDF = (title: string) => {
    showToast(`Opening ${title} Printable PDF...`);
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans print:p-0 print:space-y-4"
    >
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt !important; }
          .no-print, header, nav, aside, button { display: none !important; }
          .shadow-sm, .shadow-2xl { box-shadow: none !important; }
          .border { border-color: #cbd5e1 !important; }
          .recharts-responsive-container { width: 100% !important; }
        }
      `}</style>
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
            Platform-wide executive metrics, student engagement trends, revenue breakdowns (₹), and course category distribution.
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
            onClick={() => exportPDF('Executive Summary')}
            disabled={isLoading}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <FiDownload className="w-3.5 h-3.5" /> Export PDF
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={exportAllExcel}
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
              <option value="All">All Years</option>
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Financial Intelligence</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {revenueMetricView === 'platform'
                    ? 'Monthly Platform Net Revenue (15% Commission)'
                    : revenueMetricView === 'gross'
                    ? 'Monthly Gross Order Volume (Student Purchases)'
                    : 'Monthly Revenue Streams (Gross vs Platform vs Instructor)'}
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px]">
                <button
                  type="button"
                  onClick={() => setRevenueMetricView('platform')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    revenueMetricView === 'platform' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Platform (15%)
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueMetricView('gross')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    revenueMetricView === 'gross' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Gross Sales
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueMetricView('both')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    revenueMetricView === 'both' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Combined
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicRevenueAnalytics.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInstructor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const formatted = `₹${Number(value).toLocaleString('en-IN')}`;
                      if (name === 'platformShare') return [formatted, 'Platform Net Cut (15%)'];
                      if (name === 'instructorShare') return [formatted, 'Instructor Payouts (85%)'];
                      if (name === 'revenue') return [formatted, 'Gross Order Volume (100%)'];
                      return [formatted, name];
                    }}
                  />
                  {(revenueMetricView === 'platform' || revenueMetricView === 'both') && (
                    <Area
                      type="monotone"
                      dataKey="platformShare"
                      name="platformShare"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPlatform)"
                    />
                  )}
                  {(revenueMetricView === 'gross' || revenueMetricView === 'both') && (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="revenue"
                      stroke="#6366F1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorGross)"
                    />
                  )}
                  {revenueMetricView === 'both' && (
                    <Area
                      type="monotone"
                      dataKey="instructorShare"
                      name="instructorShare"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={0.4}
                      fill="url(#colorInstructor)"
                    />
                  )}
                  <Legend
                    formatter={(value: string) => {
                      if (value === 'platformShare') return 'Platform Share (15%)';
                      if (value === 'revenue') return 'Gross Sales (100%)';
                      if (value === 'instructorShare') return 'Instructor Share (85%)';
                      return value;
                    }}
                  />
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
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax))]}
                  />
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
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax))]}
                    />
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

          {/* Recent Student Engagement Roster */}
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase">Learner Profiles</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Student Enrollment & Completion Overview ({filteredStudents.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={exportStudentsCSV} className="text-xs rounded-xl py-1 px-3 flex items-center gap-1.5 text-indigo-600 border-indigo-200 dark:border-indigo-800/60">
                  <FiDownload className="w-3 h-3" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/users')} className="text-xs rounded-xl py-1 px-3">
                  Manage All Students
                </Button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No students match the current filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Enrolled Courses</th>
                      <th className="py-3 px-4">Completed</th>
                      <th className="py-3 px-4">Certificates</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.slice(0, 10).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullName)}&background=6366F1&color=fff`}
                              alt={s.fullName}
                              className="w-8 h-8 rounded-full object-cover border shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.fullName}</span>
                              <span className="text-[10px] text-slate-400">{s.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {s.enrolledCoursesCount || 0} Courses
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {s.completedCoursesCount || 0} Completed
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-500">
                          {s.certificatesCount || 0}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
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
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax))]}
                  />
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
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Courses</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{dynamicCourseAnalytics.totalCourses}</h3>
              <p className="text-[10px] text-slate-400 font-medium">In current filtered catalog</p>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Published & Live</span>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{dynamicCourseAnalytics.publishedCourses}</h3>
              <p className="text-[10px] text-emerald-500/80 font-medium">Active & enrollable</p>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Drafts / In Review</span>
              <h3 className="text-xl font-black text-amber-500">{dynamicCourseAnalytics.pendingApproval}</h3>
              <p className="text-[10px] text-amber-500/80 font-medium">Pending publication</p>
            </Card>

            <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Catalog Revenue</span>
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatINR(dynamicCourseAnalytics.totalRevenueINR || 0)}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Avg Rating: {dynamicCourseAnalytics.averageRating} ★</p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">Topic Distribution</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Course Category Breakdown</h3>
                </div>
                <Badge variant="primary">{dynamicCourseAnalytics.categoryDistribution.filter(c => c.count > 0).length} Categories</Badge>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicCourseAnalytics.categoryDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => percent ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                    >
                      {dynamicCourseAnalytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} Courses`, 'Total']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">Cadence Trend</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Monthly Course Publications</h3>
                </div>
                <Badge variant="success">All 12 Months</Badge>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicCourseAnalytics.monthlyPublications}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax))]}
                    />
                    <Tooltip formatter={(value: any) => [`${value} Courses`, 'Published']} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top Enrolled Masterclasses Leaderboard */}
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase">High Performers</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Top Enrolled Masterclasses</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Ranked by Total Learners</span>
            </div>

            {dynamicCourseAnalytics.mostPopularCourses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No courses available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dynamicCourseAnalytics.mostPopularCourses.map((c, index) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        index === 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:text-slate-200'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-950/60 dark:text-orange-300'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate" title={c.title}>
                          {c.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block truncate">
                          By {c.instructor} • {c.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs block">
                        {c.students} Students
                      </span>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 justify-end">
                        <FiStar className="w-2.5 h-2.5 fill-amber-500" /> {c.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Interactive Course Catalog Performance Table */}
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase">Live Catalog</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Course Catalog & Performance Overview ({filteredCourses.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCoursesCSV}
                  className="text-xs rounded-xl py-1 px-3 flex items-center gap-1.5 text-indigo-600 border-indigo-200 dark:border-indigo-800/60"
                >
                  <FiDownload className="w-3 h-3" /> Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin/courses')}
                  className="text-xs rounded-xl py-1 px-3"
                >
                  Manage All Courses
                </Button>
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No courses match the current filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <tr>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Students Enrolled</th>
                      <th className="py-3 px-4">Catalog Revenue</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCourses.slice(0, 10).map((c) => {
                      const courseRevenue =
                        c.revenueINR ||
                        (c.price ? (c.studentsEnrolled || c.total_enrolled || 0) * (c.discountPrice ?? c.price) : 0);
                      const isFree = !c.price || Number(c.price) === 0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5 max-w-xs">
                              {c.thumbnail || c.imageUrl ? (
                                <img
                                  src={c.thumbnail || c.imageUrl}
                                  alt={c.title}
                                  className="w-10 h-8 rounded-lg object-cover border shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                                  <FiBookOpen className="w-4 h-4 text-indigo-500" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-slate-100 block truncate" title={c.title}>
                                  {c.title}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {c.level || 'All Levels'} • {c.totalLessons || c.lessonsCount || 0} Lessons
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="primary" className="text-[10px]">
                              {c.category || c.categoryName || 'General'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {c.instructorName || c.instructor?.name || 'Instructor'}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {isFree ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                            ) : (
                              <span>{formatINR(c.discountPrice ?? c.price)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                            {(c.studentsEnrolled || c.total_enrolled || 0).toLocaleString()} Learners
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-100">
                            {formatINR(courseRevenue)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-amber-500 font-bold flex items-center gap-1">
                              <FiStar className="w-3 h-3 fill-amber-500" />
                              {Number(c.rating || 5.0).toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                (c.status || c.courseStatus) === 'Published'
                                  ? 'success'
                                  : (c.status || c.courseStatus) === 'Pending'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {c.status || c.courseStatus || 'Draft'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
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
              <Button size="sm" variant="outline" onClick={() => exportPDF('Student')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={exportStudentsCSV} className="text-xs py-1 px-2.5 rounded-lg flex-1">
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
              <Button size="sm" variant="outline" onClick={() => exportPDF('Instructor')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={exportInstructorsCSV} className="text-xs py-1 px-2.5 rounded-lg flex-1">
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
              <Button size="sm" variant="outline" onClick={() => exportPDF('Course')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={exportCoursesCSV} className="text-xs py-1 px-2.5 rounded-lg flex-1">
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
              <Button size="sm" variant="outline" onClick={() => exportPDF('Revenue')} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={exportRevenueCSV} className="text-xs py-1 px-2.5 rounded-lg flex-1">
                Excel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

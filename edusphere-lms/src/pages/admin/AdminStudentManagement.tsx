import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle,
  FiBookOpen,
  FiPhone,
  FiMail,
  FiMapPin,
  FiX,
  FiAward,
  FiCreditCard,
  FiClock,
  FiLayers,
  FiFileText,
  FiHelpCircle,
  FiToggleLeft,
  FiToggleRight,
  FiAlertTriangle,
  FiExternalLink,
  FiRefreshCw
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/common/Avatar';
import { adminService, type AdminUserProfile } from '../../services/adminService';
import { enrollmentService, type FrontendEnrollment } from '../../services/enrollmentService';

export interface DetailedEnrolledCourse {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  category: string;
  instructorName: string;
  enrollmentDate: string;
  progress: number;
  status: 'In Progress' | 'Completed';

  // Learning progress breakdown
  lessonsCompleted: number;
  totalLessons: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  quizzesPassed: number;
  totalQuizzes: number;

  // Payment details
  paymentStatus: 'Paid' | 'Free' | 'Pending';
  paymentMethod: string;
  amountINR: number;
  transactionId: string;
  purchaseDate: string;

  // Certificate status
  certificateStatus: 'Eligible' | 'Generated' | 'Not Eligible';
  certificateReason?: string;
  certificateId?: string;

  // Activity
  lastLogin: string;
  lastLessonCompleted: string;
  lastAssignmentSubmitted: string;
  lastQuizAttempt: string;
}

export interface EnhancedStudentRecord {
  id: string;
  studentId: string;
  name: string;
  email: string;
  mobile: string;
  avatar: string;
  dob: string;
  gender: string;
  country: string;
  state: string;
  city: string;
  status: 'Active' | 'Inactive';
  registeredDate: string;
  enrolledCourses: DetailedEnrolledCourse[];
}

const mapProfileToStudentRecord = (
  p: AdminUserProfile,
  enrollmentsForUser: FrontendEnrollment[] = []
): EnhancedStudentRecord => {
  const detailedCourses: DetailedEnrolledCourse[] = enrollmentsForUser.map((enr) => {
    const isCompleted = enr.status === 'Completed';
    const enrDate = enr.enrolledAt
      ? new Date(enr.enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Recently';

    return {
      courseId: enr.courseId,
      courseTitle: enr.courseTitle || 'Untitled Course',
      thumbnail:
        enr.courseThumbnail ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      category: 'Course',
      instructorName: enr.instructorName || 'EduSphere Instructor',
      enrollmentDate: enrDate,
      progress: isCompleted ? 100 : 0,
      status: isCompleted ? 'Completed' : 'In Progress',
      lessonsCompleted: isCompleted ? 1 : 0,
      totalLessons: 1,
      assignmentsCompleted: isCompleted ? 1 : 0,
      totalAssignments: 1,
      quizzesPassed: isCompleted ? 1 : 0,
      totalQuizzes: 1,
      paymentStatus: 'Paid',
      paymentMethod: 'Platform Enrollment',
      amountINR: 0,
      transactionId: `TXN-${enr.id ? enr.id.substring(0, 8).toUpperCase() : 'DIRECT'}`,
      purchaseDate: enrDate,
      certificateStatus: isCompleted ? 'Generated' : 'Not Eligible',
      certificateReason: isCompleted ? undefined : 'Course in progress',
      certificateId: isCompleted ? `CERT-${enr.id.substring(0, 8).toUpperCase()}` : undefined,
      lastLogin: 'Active recently',
      lastLessonCompleted: isCompleted ? 'Course Final Module' : 'In progress',
      lastAssignmentSubmitted: isCompleted ? 'Completed' : 'Pending',
      lastQuizAttempt: isCompleted ? 'Completed (100%)' : 'Pending',
    };
  });

  const regDate = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Recently';

  const birthDate = p.dateOfBirth
    ? new Date(p.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not Specified';

  return {
    id: p.id,
    studentId: p.studentIdNumber || `STU-${p.id.substring(0, 8).toUpperCase()}`,
    name: p.fullName || p.email?.split('@')[0] || 'EduSphere Student',
    email: p.email,
    mobile: p.phone || 'Not Provided',
    avatar: p.avatarUrl || '',
    dob: birthDate,
    gender: p.gender || 'Not Specified',
    country: p.country || 'India',
    state: p.state || 'Not Specified',
    city: p.city || 'Not Specified',
    registeredDate: regDate,
    status: p.status === 'active' ? 'Active' : 'Inactive',
    enrolledCourses: detailedCourses,
  };
};

export const AdminStudentManagement: React.FC = () => {
  const [students, setStudents] = useState<EnhancedStudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStudent, setSelectedStudent] = useState<EnhancedStudentRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [courseFilter, setCourseFilter] = useState<string>('All');
  const [certFilter, setCertFilter] = useState<string>('All');

  const [detailTab, setDetailTab] = useState<'personal' | 'courses' | 'progress' | 'payment' | 'certificate' | 'activity'>('courses');
  const [activeCourseIdx, setActiveCourseIdx] = useState<number>(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsRes, enrollmentsRes] = await Promise.allSettled([
        adminService.getStudents(),
        enrollmentService.getAdminEnrollments(),
      ]);

      const rawStudents: AdminUserProfile[] =
        studentsRes.status === 'fulfilled' && studentsRes.value?.success && Array.isArray(studentsRes.value?.data)
          ? studentsRes.value.data
          : [];

      const rawEnrollments: FrontendEnrollment[] =
        enrollmentsRes.status === 'fulfilled' && enrollmentsRes.value?.success && Array.isArray(enrollmentsRes.value?.data)
          ? enrollmentsRes.value.data
          : [];

      // Group enrollments by student ID
      const enrollmentsByStudent: Record<string, FrontendEnrollment[]> = {};
      rawEnrollments.forEach((enr) => {
        if (enr.studentId) {
          if (!enrollmentsByStudent[enr.studentId]) {
            enrollmentsByStudent[enr.studentId] = [];
          }
          enrollmentsByStudent[enr.studentId].push(enr);
        }
      });

      const liveRecords = rawStudents.map((p) =>
        mapProfileToStudentRecord(p, enrollmentsByStudent[p.id] || [])
      );

      setStudents(liveRecords);
    } catch (err) {
      console.error('Failed to load students in AdminStudentManagement:', err);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const totalStudentsCount = students.length;
  const activeStudentsCount = useMemo(() => students.filter((s) => s.status === 'Active').length, [students]);
  const inactiveStudentsCount = useMemo(() => students.filter((s) => s.status === 'Inactive').length, [students]);
  const totalEnrollmentsCount = useMemo(
    () => students.reduce((acc, s) => acc + s.enrolledCourses.length, 0),
    [students]
  );

  const allCourseTitles = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.enrolledCourses.forEach((c) => set.add(c.courseTitle)));
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.enrolledCourses.some((c) => c.courseTitle.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesCourse = courseFilter === 'All' || s.enrolledCourses.some((c) => c.courseTitle === courseFilter);
      const matchesCert =
        certFilter === 'All' || s.enrolledCourses.some((c) => c.certificateStatus === certFilter);

      return matchesSearch && matchesStatus && matchesCourse && matchesCert;
    });
  }, [students, searchQuery, statusFilter, courseFilter, certFilter]);

  const handleToggleAccountStatus = async (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;

    const newStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await adminService.updateUserStatus(studentId, newStatus === 'Active' ? 'active' : 'inactive');
      showToast(`Student ${target.name} account status updated to ${newStatus}.`);

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      );

      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, status: newStatus });
      }
    } catch (err: any) {
      showToast(`Failed to update status: ${err?.message || 'Server error'}`);
    }
  };

  const openStudentDetails = (s: EnhancedStudentRecord, initialTab: typeof detailTab = 'courses') => {
    setSelectedStudent(s);
    setDetailTab(initialTab);
    setActiveCourseIdx(0);
  };

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
            <FiUsers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Student & Enrollment Directory Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unified student administration, live database directory, course enrollments, and account status controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadStudents}
            disabled={isLoading}
            className="text-xs rounded-xl flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </Button>
          <Badge variant="neutral">Platform Student Master</Badge>
        </div>
      </div>

      {/* Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Students</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalStudentsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <FiUserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Accounts</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{activeStudentsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-3 bg-slate-400 text-white rounded-xl shadow-sm">
            <FiUserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Inactive Accounts</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{inactiveStudentsCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-3">
          <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Course Enrollments</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalEnrollmentsCount}</h3>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Student Name, ID, Email, Course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-500">
              <FiFilter className="w-4 h-4 text-slate-400" /> Filters:
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Account Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Enrolled Courses</option>
              {allCourseTitles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Certificates</option>
              <option value="Generated">Generated</option>
              <option value="Eligible">Eligible</option>
              <option value="Not Eligible">Not Eligible</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Student List View Table */}
      {isLoading ? (
        <Card className="p-12 text-center rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading registered students from database...</p>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiUsers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {students.length === 0 ? 'No registered students found' : 'No student records matched your filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {students.length === 0
              ? 'When students register on the platform, their records and course enrollments will appear here automatically.'
              : 'Try clearing your search query or adjusting your status/course filter parameters.'}
          </p>
          {(searchQuery || statusFilter !== 'All' || courseFilter !== 'All' || certFilter !== 'All') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setCourseFilter('All');
                setCertFilter('All');
              }}
              className="text-xs rounded-xl"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Student Profile</th>
                  <th className="py-3.5 px-4">Contact & Location</th>
                  <th className="py-3.5 px-4">Enrolled Courses</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student) => {
                  const avgProgress =
                    student.enrolledCourses.length > 0
                      ? Math.round(
                          student.enrolledCourses.reduce((acc, c) => acc + c.progress, 0) /
                            student.enrolledCourses.length
                        )
                      : 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {student.studentId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={student.avatar}
                            name={student.name}
                            email={student.email}
                            role="student"
                            size="md"
                            className="border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Registered: {student.registeredDate}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {student.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <FiMapPin className="w-3.5 h-3.5 shrink-0" />
                          {student.city !== 'Not Specified' || student.state !== 'Not Specified'
                            ? `${student.city}, ${student.state}`
                            : student.country}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={student.enrolledCourses.length > 0 ? 'primary' : 'neutral'}>
                              {student.enrolledCourses.length} Enrolled Course{student.enrolledCourses.length === 1 ? '' : 's'}
                            </Badge>
                            {student.enrolledCourses.length > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {avgProgress}% Avg Progress
                              </span>
                            )}
                          </div>
                          {student.enrolledCourses.length > 0 ? (
                            <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                              {student.enrolledCourses.map((c) => c.courseTitle).join(', ')}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No courses enrolled yet</p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={student.status === 'Active' ? 'success' : 'neutral'}>
                          {student.status === 'Active' ? '✓ Active' : '✕ Inactive'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openStudentDetails(student, 'courses')}
                            className="text-xs py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1 shadow-sm font-bold"
                          >
                            <FiEye className="w-3.5 h-3.5" /> View Details
                          </Button>

                          <button
                            onClick={() => handleToggleAccountStatus(student.id)}
                            className={`p-1.5 rounded-xl transition-colors ${
                              student.status === 'Active'
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                            }`}
                            title={student.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {student.status === 'Active' ? (
                              <FiToggleRight className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <FiToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* EXPANDED STUDENT DETAILS MODAL / DRAWER */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedStudent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans"
            role="dialog"
            aria-label="Student Details"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    {selectedStudent.studentId}
                  </span>
                  <Badge variant={selectedStudent.status === 'Active' ? 'success' : 'neutral'}>
                    Account Status: {selectedStudent.status}
                  </Badge>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Personal Information Header Banner */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-xs">
                <Avatar
                  src={selectedStudent.avatar}
                  name={selectedStudent.name}
                  email={selectedStudent.email}
                  role="student"
                  size="2xl"
                  shape="rounded"
                  className="border-2 border-indigo-600 shadow-md shrink-0"
                />

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {selectedStudent.name}
                    </h2>
                    <span className="text-slate-400">
                      ({selectedStudent.gender}, DOB: {selectedStudent.dob})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <FiMail className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {selectedStudent.email}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiPhone className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {selectedStudent.mobile}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {selectedStudent.city !== 'Not Specified' || selectedStudent.state !== 'Not Specified'
                        ? `${selectedStudent.city}, ${selectedStudent.state}`
                        : selectedStudent.country}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    Registered on Platform: <strong>{selectedStudent.registeredDate}</strong>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={selectedStudent.status === 'Active' ? 'outline' : 'primary'}
                    onClick={() => handleToggleAccountStatus(selectedStudent.id)}
                    className="text-xs rounded-xl py-1.5 px-3"
                  >
                    {selectedStudent.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                  </Button>
                </div>
              </div>

              {/* Tabs Bar inside Student Details */}
              <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
                {[
                  { id: 'courses', label: `Enrolled Courses (${selectedStudent.enrolledCourses.length})`, icon: FiBookOpen },
                  { id: 'progress', label: 'Learning Progress Breakdown', icon: FiLayers },
                  { id: 'payment', label: 'Payment Information (₹)', icon: FiCreditCard },
                  { id: 'certificate', label: 'Certificate Status', icon: FiAward },
                  { id: 'activity', label: 'Student Activity Log', icon: FiClock },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = detailTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setDetailTab(t.id as any)}
                      className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: ENROLLED COURSES */}
              {detailTab === 'courses' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Enrolled Courses List ({selectedStudent.enrolledCourses.length})
                  </h3>

                  {selectedStudent.enrolledCourses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <FiBookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No enrolled courses</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">This student has not enrolled in any courses yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudent.enrolledCourses.map((cItem, cIdx) => (
                        <div
                          key={cItem.courseId}
                          className={`p-4 rounded-2xl border transition-all text-xs space-y-3 bg-white dark:bg-slate-900 ${
                            activeCourseIdx === cIdx
                              ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                          onClick={() => setActiveCourseIdx(cIdx)}
                        >
                          <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={cItem.thumbnail} alt={cItem.courseTitle} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2">
                              <Badge variant={cItem.status === 'Completed' ? 'primary' : 'success'}>
                                {cItem.status}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase">{cItem.category}</span>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                              {cItem.courseTitle}
                            </h4>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Instructor: {cItem.instructorName} • Enrolled: {cItem.enrollmentDate}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-slate-500">Course Progress</span>
                              <span className="text-indigo-600 dark:text-indigo-400">{cItem.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cItem.progress}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${
                                  cItem.progress === 100 ? 'bg-blue-500' : 'bg-indigo-600'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast(`Viewing details for ${cItem.courseTitle}`);
                              }}
                              className="text-xs py-1 px-3 rounded-lg flex items-center gap-1"
                            >
                              <FiExternalLink className="w-3 h-3 text-indigo-500" /> View Course
                            </Button>

                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCourseIdx(cIdx);
                                setDetailTab('progress');
                              }}
                              className="text-xs py-1 px-3 bg-indigo-600 text-white rounded-lg"
                            >
                              View Progress
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LEARNING PROGRESS BREAKDOWN */}
              {detailTab === 'progress' && (
                <div className="space-y-5 text-xs">
                  {selectedStudent.enrolledCourses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <FiLayers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No progress data</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Progress breakdown will show once the student enrolls in a course.</p>
                    </div>
                  ) : selectedStudent.enrolledCourses[activeCourseIdx] ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase">Selected Course Progress</span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {selectedStudent.enrolledCourses[activeCourseIdx].courseTitle}
                          </h4>
                        </div>
                        <Badge variant="primary">
                          {selectedStudent.enrolledCourses[activeCourseIdx].progress}% Overall Progress
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <FiBookOpen className="w-4 h-4 text-purple-500 mx-auto" />
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Lessons Completed</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {selectedStudent.enrolledCourses[activeCourseIdx].lessonsCompleted} /{' '}
                            {selectedStudent.enrolledCourses[activeCourseIdx].totalLessons}
                          </span>
                        </div>

                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <FiFileText className="w-4 h-4 text-indigo-500 mx-auto" />
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Assignments</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {selectedStudent.enrolledCourses[activeCourseIdx].assignmentsCompleted} /{' '}
                            {selectedStudent.enrolledCourses[activeCourseIdx].totalAssignments}
                          </span>
                        </div>

                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <FiHelpCircle className="w-4 h-4 text-amber-500 mx-auto" />
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Quizzes Passed</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {selectedStudent.enrolledCourses[activeCourseIdx].quizzesPassed} /{' '}
                            {selectedStudent.enrolledCourses[activeCourseIdx].totalQuizzes}
                          </span>
                        </div>

                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <FiAward className="w-4 h-4 text-emerald-500 mx-auto" />
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificate</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {selectedStudent.enrolledCourses[activeCourseIdx].certificateStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 3: PAYMENT INFORMATION (₹ INDIAN RUPEE) */}
              {detailTab === 'payment' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Payment & Transaction Details (Read-Only Reference ₹)
                  </h3>

                  {selectedStudent.enrolledCourses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <FiCreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No transactions</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">No enrollment payment records found for this student.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.enrolledCourses.map((c) => (
                        <div
                          key={c.courseId}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.courseTitle}</span>
                            <Badge variant={c.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                              {c.paymentStatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-slate-400 block text-[10px] font-semibold">Amount</span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {c.amountINR > 0 ? `₹${c.amountINR.toLocaleString('en-IN')}` : 'Enrolled'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-semibold">Payment Method</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{c.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-semibold">Transaction ID</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.transactionId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-semibold">Enrolled Date</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{c.purchaseDate}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CERTIFICATE STATUS */}
              {detailTab === 'certificate' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Course Certificate Verification
                  </h3>

                  {selectedStudent.enrolledCourses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <FiAward className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No certificates</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Certificates will appear once the student completes a course.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.enrolledCourses.map((c) => (
                        <div
                          key={c.courseId}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.courseTitle}</span>
                            <Badge
                              variant={
                                c.certificateStatus === 'Generated'
                                  ? 'primary'
                                  : c.certificateStatus === 'Eligible'
                                  ? 'success'
                                  : 'neutral'
                              }
                            >
                              {c.certificateStatus}
                            </Badge>
                          </div>

                          {c.certificateStatus === 'Generated' && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                              <div className="flex items-center gap-2">
                                <FiAward className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Certificate Issued: {c.certificateId}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => showToast(`Certificate: ${c.certificateId}`)}
                                className="text-xs py-1 px-3"
                              >
                                View Certificate
                              </Button>
                            </div>
                          )}

                          {c.certificateStatus === 'Not Eligible' && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 flex items-center gap-2">
                              <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                <strong>Status:</strong> {c.certificateReason || 'Course requirements not completed yet.'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: STUDENT ACTIVITY LOG */}
              {detailTab === 'activity' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Student Recent Activity Log
                  </h3>

                  {selectedStudent.enrolledCourses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <FiClock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No activity recorded</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Activity will be logged as the student progresses through enrolled courses.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.enrolledCourses.map((c) => (
                        <div
                          key={c.courseId}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                        >
                          <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">{c.courseTitle}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                              <strong>Last Login:</strong> {c.lastLogin}
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                              <strong>Last Lesson Completed:</strong> {c.lastLessonCompleted}
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                              <strong>Last Assignment Submitted:</strong> {c.lastAssignmentSubmitted}
                            </div>
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                              <strong>Last Quiz Attempt:</strong> {c.lastQuizAttempt}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Footer Quick Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStudent(null)}
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

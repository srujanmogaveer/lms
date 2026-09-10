import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiCheckCircle,
  FiLock,
  FiAward,
  FiArrowLeft,
  FiEye,
  FiBookOpen,
  FiActivity,
  FiMessageSquare,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/common/Avatar';
import { enrollmentService } from '../../services/enrollmentService';
import type {
  DetailedStudentProgressItem,
  CertificateEligibilityStatus,
} from '../../data/instructorStudentsData';

type FilterProgressTab = 'All' | 'High Progress (>75%)' | 'In Progress (25-75%)' | 'Needs Attention (<25%)';

export const InstructorStudentManagement: React.FC = () => {
  const navigate = useNavigate();

  // Loading & Data State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<DetailedStudentProgressItem[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  // Active Selected Student Details View
  const [selectedStudent, setSelectedStudent] = useState<DetailedStudentProgressItem | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedCertFilter, setSelectedCertFilter] = useState<string>('All');
  const [activeProgressTab, setActiveProgressTab] = useState<FilterProgressTab>('All');

  // Fetch real student enrollments and course list
  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const res = await enrollmentService.getInstructorEnrollments();
      if (res && res.success && res.data) {
        if (Array.isArray(res.data.students)) {
          setStudents(res.data.students);
        } else if (Array.isArray(res.data)) {
          setStudents(res.data);
        }

        if (Array.isArray(res.data.courses)) {
          setCourses(res.data.courses);
        }
      }
    } catch {
      // Keep existing cached data on network error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Dashboard Overview Metrics
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.isActive).length;
    const courseCompletions = students.filter((s) => s.overallProgressPercentage === 100).length;
    const certificatesEligible = students.filter((s) => s.certificateStatus === 'Eligible').length;

    return { totalStudents, activeStudents, courseCompletions, certificatesEligible };
  }, [students]);

  // Filtered Students Roster
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.courseTitle.toLowerCase().includes(q);

      const matchesCourse = selectedCourseFilter === 'All' || s.courseId === selectedCourseFilter;
      const matchesCert = selectedCertFilter === 'All' || s.certificateStatus === selectedCertFilter;

      let matchesProgress = true;
      if (activeProgressTab === 'High Progress (>75%)') matchesProgress = s.overallProgressPercentage >= 75;
      if (activeProgressTab === 'In Progress (25-75%)')
        matchesProgress = s.overallProgressPercentage >= 25 && s.overallProgressPercentage < 75;
      if (activeProgressTab === 'Needs Attention (<25%)') matchesProgress = s.overallProgressPercentage < 25;

      return matchesSearch && matchesCourse && matchesCert && matchesProgress;
    });
  }, [students, searchQuery, selectedCourseFilter, selectedCertFilter, activeProgressTab]);

  // Certificate Status Badge Renderer
  const renderCertificateBadge = (status: CertificateEligibilityStatus, lockReason?: string) => {
    if (status === 'Eligible') {
      return (
        <Badge variant="success" className="flex items-center gap-1 font-bold">
          <FiAward className="w-3.5 h-3.5 text-emerald-500" /> Certificate Eligible
        </Badge>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Badge variant="warning" className="flex items-center gap-1 font-bold">
          <FiLock className="w-3.5 h-3.5 text-amber-500" /> Locked
        </Badge>
        {lockReason && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hidden md:inline truncate max-w-xs">
            ({lockReason})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Instructor Student Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitor enrolled students, track lesson progress, assignment completion, quiz performance, and certificate eligibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudentData}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          {selectedStudent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStudent(null)}
              className="flex items-center gap-1.5 text-xs"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Student Roster
            </Button>
          )}
        </div>
      </div>

      {/* KPI Dashboard Overview Cards */}
      {!selectedStudent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Students
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {stats.totalStudents}
              </div>
            </div>
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600">
              <FiUsers className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
                Active Students
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.activeStudents}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <FiActivity className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block">
                Course Completions
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {stats.courseCompletions}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
                Certificates Eligible
              </span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {stats.certificatesEligible}
              </div>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
              <FiAward className="w-5 h-5" />
            </div>
          </Card>
        </div>
      )}

      {/* VIEW 1: ENROLLED STUDENT ROSTER FEED */}
      {!selectedStudent && (
        <div className="space-y-4">
          {/* Search & Filters Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Student Name, Student ID, Email, or Course Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Course & Certificate Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="All">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedCertFilter}
                onChange={(e) => setSelectedCertFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
              >
                <option value="All">All Certificate Statuses</option>
                <option value="Eligible">Eligible Only</option>
                <option value="Locked">Locked Only</option>
              </select>
            </div>
          </div>

          {/* Progress Tab Filters */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {(
              [
                'All',
                'High Progress (>75%)',
                'In Progress (25-75%)',
                'Needs Attention (<25%)',
              ] as FilterProgressTab[]
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveProgressTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors whitespace-nowrap ${
                  activeProgressTab === tab
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Empty State */}
          {filteredStudents.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 bg-white dark:bg-slate-900">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FiUsers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {students.length === 0 ? 'No students enrolled yet.' : 'No students matching filter.'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {students.length === 0
                    ? 'When students purchase and enroll in your published courses, they will appear in this roster with live learning progress.'
                    : 'There are no enrolled students matching your search criteria or progress filters.'}
                </p>
              </div>
            </Card>
          ) : (
            /* Student Roster Table */
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4">Student Profile & ID</th>
                    <th className="p-4">Course Name</th>
                    <th className="p-4">Enrollment Date</th>
                    <th className="p-4">Overall Progress</th>
                    <th className="p-4">Certificate Eligibility</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((std) => (
                    <tr
                      key={std.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Profile Photo & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={std.studentAvatar}
                            name={std.studentName}
                            email={std.email}
                            size="md"
                            className="shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                              {std.studentName}
                              {std.isActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Student" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              ID: <span className="font-mono">{std.studentId}</span> • {std.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course Title */}
                      <td className="p-4 max-w-xs">
                        <span className="font-semibold text-purple-600 dark:text-purple-400 line-clamp-1">
                          {std.courseTitle}
                        </span>
                      </td>

                      {/* Enrollment Date */}
                      <td className="p-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                        {std.enrollmentDate}
                      </td>

                      {/* Progress Bar Column */}
                      <td className="p-4 w-48">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-700 dark:text-slate-300">
                              {std.overallProgressPercentage}%
                            </span>
                            <span className="text-slate-400">
                              {std.lessonsCompleted}/{std.totalLessons} Lessons
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                std.overallProgressPercentage === 100
                                  ? 'bg-emerald-500'
                                  : std.overallProgressPercentage >= 60
                                  ? 'bg-purple-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, std.overallProgressPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Certificate Badge */}
                      <td className="p-4 whitespace-nowrap">
                        {renderCertificateBadge(std.certificateStatus, std.certificateLockReason)}
                      </td>

                      {/* View Details Button */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(std)}
                          className="font-bold text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <FiEye className="w-3.5 h-3.5" /> View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* VIEW 2: COMPREHENSIVE STUDENT DETAILS & LEARNING PROGRESS */}
      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* TOP SECTION: STUDENT DETAILS CARD */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={selectedStudent.studentAvatar}
                  name={selectedStudent.studentName}
                  email={selectedStudent.email}
                  size="xl"
                  className="shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {selectedStudent.studentName}
                    </h2>
                    {selectedStudent.isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                        Active Student
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                    {selectedStudent.courseTitle}
                  </p>
                </div>
              </div>

              {/* Quick Actions Header Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/instructor/chat')}
                  className="flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  <FiMessageSquare className="w-3.5 h-3.5" /> Send Message
                </Button>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Student ID
                </span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedStudent.studentId}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Email Address
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {selectedStudent.email}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Phone Number
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedStudent.phone}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Enrollment Date
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedStudent.enrollmentDate}
                </span>
              </div>
            </div>
          </Card>

          {/* MIDDLE SECTION: LEARNING PROGRESS & CERTIFICATE ELIGIBILITY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Detailed Progress Bars */}
            <Card className="lg:col-span-8 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FiBookOpen className="w-4 h-4 text-purple-600" />
                Learning Progress Breakdown
              </h3>

              {/* Progress Bars List */}
              <div className="space-y-5 text-xs">
                {/* Lesson Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Lesson Progress ({selectedStudent.lessonsCompleted}/{selectedStudent.totalLessons} Lessons)
                    </span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      {selectedStudent.lessonProgressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, selectedStudent.lessonProgressPercentage)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-purple-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Assignment Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      Assignment Progress ({selectedStudent.assignmentsCompleted}/{selectedStudent.totalAssignments} Completed)
                      {selectedStudent.assignmentStatus === 'Completed' ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-[10px] font-extrabold">
                          Completed
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 text-[10px] font-extrabold">
                          Pending
                        </span>
                      )}
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      {selectedStudent.assignmentProgressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, selectedStudent.assignmentProgressPercentage)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Quiz Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      Quiz Progress ({selectedStudent.quizzesPassed}/{selectedStudent.totalQuizzes} Passed)
                      {selectedStudent.quizStatus === 'Passed' ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-[10px] font-extrabold">
                          Passed
                        </span>
                      ) : selectedStudent.quizStatus === 'Failed' ? (
                        <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 text-[10px] font-extrabold">
                          Failed
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 text-[10px] font-extrabold">
                          Not Attempted
                        </span>
                      )}
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedStudent.quizProgressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, selectedStudent.quizProgressPercentage)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Overall Course Progress Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      Overall Course Completion
                    </span>
                    <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                      {selectedStudent.overallProgressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, selectedStudent.overallProgressPercentage)}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Right 4 Cols: Certificate Status & Lock Reasons */}
            <Card className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <FiAward className="w-4 h-4 text-amber-500" />
                  Certificate Eligibility
                </h3>

                <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Status:</span>
                    {renderCertificateBadge(selectedStudent.certificateStatus)}
                  </div>

                  {selectedStudent.certificateStatus === 'Eligible' ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <FiCheck className="w-4 h-4 text-emerald-600" /> Fully Eligible!
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Student has completed 100% of lessons, submitted all mandatory assignments, and passed all course quizzes.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4 text-amber-600" /> Requirements Pending:
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed">
                        {selectedStudent.certificateLockReason || 'Course requirements incomplete.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Summary Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block font-bold">Lessons</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    {selectedStudent.lessonsCompleted}/{selectedStudent.totalLessons}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block font-bold">Quizzes</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    {selectedStudent.quizzesPassed}/{selectedStudent.totalQuizzes} Passed
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* BOTTOM SECTION: PERFORMANCE SUMMARY & STUDENT ACTIVITY LOG */}
          <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-purple-600" />
              Recent Student Activity Log
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Last Login
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {selectedStudent.lastLogin}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Last Lesson Completed
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400 block line-clamp-1">
                  {selectedStudent.lastLessonCompleted}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Last Assignment Submitted
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400 block line-clamp-1">
                  {selectedStudent.lastAssignmentSubmitted}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Last Quiz Attempt
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block line-clamp-1">
                  {selectedStudent.lastQuizAttempt}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

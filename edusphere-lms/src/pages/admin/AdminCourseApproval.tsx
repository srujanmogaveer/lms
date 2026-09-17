import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArchive,
  FiSearch,
  FiFilter,
  FiEye
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { type InstructorCourseItem, type ApprovalStatusType } from '../../data/instructorCoursesData';
import { AdminCourseReview } from './AdminCourseReview';
import { courseService } from '../../services/courseService';
import {
  showSuccessAlert,
  showConfirmAlert
} from '../../utils/swalAlerts';

export const AdminCourseApproval: React.FC = () => {
  const [courses, setCourses] = useState<InstructorCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCourse, setSelectedCourse] = useState<InstructorCourseItem | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Notification Toast State
  const [toastMessage] = useState<string | null>(null);

  // Load Admin Courses from Backend API
  const fetchAdminCourses = async () => {
    try {
      setIsLoading(true);
      const res = await courseService.getAdminCourses();
      if (res.success && Array.isArray(res.data)) {
        setCourses(res.data);
      } else {
        setCourses([]);
      }
    } catch {
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAdminCourses();
  }, []);

  // Status Action Handlers
  const handleApproveCourse = async (courseId: string) => {
    const confirmed = await showConfirmAlert(
      'Approve & Publish Course?',
      'Are you sure you want to approve this course? It will immediately become live and available in the public student catalog.',
      'Yes, Approve & Publish',
      'Cancel',
      'question'
    );

    if (confirmed) {
      try {
        await courseService.approveCourse(courseId);
      } catch {
        // Keep optimistic update
      }

      setCourses((prev) =>
        prev.map((c) => {
          if (c.id === courseId) {
            return {
              ...c,
              approvalStatus: 'Approved' as ApprovalStatusType,
              courseStatus: 'Published' as const,
            };
          }
          return c;
        })
      );
      showSuccessAlert('Approved!', 'Course has been approved and published to the student catalog.');
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse((prev) => (prev ? { ...prev, approvalStatus: 'Approved', courseStatus: 'Published' } : null));
      }
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    const confirmed = await showConfirmAlert(
      'Reject Course?',
      'Are you sure you want to reject this course submission?',
      'Reject Course',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        await courseService.rejectCourse(courseId, 'Course requires further review and revisions before approval.');
      } catch {
        // Fallback
      }

      setCourses((prev) =>
        prev.map((c) => {
          if (c.id === courseId) {
            return {
              ...c,
              approvalStatus: 'Rejected' as ApprovalStatusType,
              courseStatus: 'Draft' as const,
            };
          }
          return c;
        })
      );
      showSuccessAlert('Success!', 'Course rejected.');
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse((prev) => (prev ? { ...prev, approvalStatus: 'Rejected', courseStatus: 'Draft' } : null));
      }
    }
  };

  const handleRequestChanges = async (courseId: string, feedback: string) => {
    try {
      await courseService.rejectCourse(courseId, feedback);
    } catch {
      // Fallback
    }

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            approvalStatus: 'Rejected' as ApprovalStatusType,
            courseStatus: 'Draft' as const,
            rejectionReason: feedback,
          };
        }
        return c;
      })
    );
    showSuccessAlert('Success!', 'Feedback and change requests sent to instructor.');
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, approvalStatus: 'Rejected', rejectionReason: feedback } : null));
    }
  };

  // Metrics Calculation
  const totalCoursesCount = courses.length;
  const pendingCount = useMemo(() => courses.filter((c) => c.approvalStatus === 'Pending Approval').length, [courses]);
  const approvedCount = useMemo(() => courses.filter((c) => c.approvalStatus === 'Approved').length, [courses]);
  const rejectedCount = useMemo(() => courses.filter((c) => c.approvalStatus === 'Rejected').length, [courses]);
  const archivedCount = useMemo(() => courses.filter((c) => c.approvalStatus === 'Archived').length, [courses]);

  // Unique Categories List
  const uniqueCategories = useMemo(() => Array.from(new Set(courses.map((c) => c.category))), [courses]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || c.approvalStatus.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [courses, searchQuery, statusFilter, categoryFilter]);

  // Render Full Course Review Page view if selectedCourse is active
  if (selectedCourse) {
    return (
      <div className="relative">
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

        <AdminCourseReview
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
          onApprove={handleApproveCourse}
          onReject={handleRejectCourse}
          onRequestChanges={handleRequestChanges}
        />
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiBookOpen className="w-7 h-7 text-amber-500" /> Course Governance & Approval Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Click <strong>Review</strong> on any course to open the complete Course Review page for in-depth inspection before approval.
          </p>
        </div>
        <Badge variant="warning" className="self-start sm:self-auto">
          Governance Control
        </Badge>
      </div>

      {/* Course Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Courses</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalCoursesCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
          <div className="p-3 bg-amber-600 text-white rounded-xl shadow-sm">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Approval</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{pendingCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Approved Courses</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{approvedCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Rejected Courses</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{rejectedCount}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
            <FiArchive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Archived Courses</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{archivedCount}</h3>
          </div>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Course Title or Category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <FiFilter className="w-4 h-4 text-slate-400" /> Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Course List Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading courses from database...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiBookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No courses available.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No course submission matched your search or status filter parameters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
              setCategoryFilter('All');
            }}
            className="text-xs rounded-xl"
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-full space-y-4 shadow-sm">
                <div className="space-y-3">
                  {/* Thumbnail & Status Badge */}
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={
                          course.approvalStatus === 'Approved'
                            ? 'success'
                            : course.approvalStatus === 'Pending Approval'
                            ? 'warning'
                            : course.approvalStatus === 'Archived'
                            ? 'neutral'
                            : 'danger'
                        }
                        className="shadow-lg"
                      >
                        {course.approvalStatus === 'Approved'
                          ? '✓ Published'
                          : course.approvalStatus === 'Pending Approval'
                          ? '⏳ Pending'
                          : course.approvalStatus === 'Archived'
                          ? '📦 Archived'
                          : '✕ Rejected'}
                      </Badge>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <span className="truncate">{course.category}</span>
                      <div className="shrink-0 flex items-center">
                        {course.price === 0 || course.priceType === 'Free' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-md text-[10px]">
                            FREE
                          </span>
                        ) : course.discountPrice && course.discountPrice > 0 && course.discountPrice < course.price ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                              ₹{course.discountPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through font-medium">
                              ₹{course.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-100 font-extrabold text-xs">
                            ₹{course.price ? course.price.toLocaleString('en-IN') : '0'}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 pt-0.5">
                      {course.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Created: {(() => {
                      if (!course.createdAt) return 'Recently';
                      try {
                        const d = new Date(course.createdAt);
                        return isNaN(d.getTime()) ? course.createdAt : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      } catch {
                        return course.createdAt;
                      }
                    })()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setSelectedCourse(course)}
                      className="text-xs py-1.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <FiEye className="w-3.5 h-3.5" /> Review
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

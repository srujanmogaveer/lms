import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AssignmentHeader,
} from '../../components/assignments/AssignmentHeader';
import {
  AssignmentStatsCards,
} from '../../components/assignments/AssignmentStatsCards';
import {
  AssignmentFilterBar,
  type AssignmentFilterState,
} from '../../components/assignments/AssignmentFilterBar';
import { AssignmentCard } from '../../components/assignments/AssignmentCard';
import { UpcomingDeadlinesSidebar } from '../../components/assignments/UpcomingDeadlinesSidebar';
import { AssignmentDetailsModal } from '../../components/assignments/AssignmentDetailsModal';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { assignmentService } from '../../services/assignmentService';
import type { StudentAssignmentDetail } from '../../types';

export const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId?: string }>();

  // State Management with Instant Cache Initialization (0ms UI render)
  const cachedAssignments = assignmentService.getCachedStudentEnrolledAssignments(courseId);
  const [assignments, setAssignments] = useState<StudentAssignmentDetail[]>(() => (cachedAssignments as StudentAssignmentDetail[]) || []);
  const [isLoading, setIsLoading] = useState(() => !cachedAssignments || cachedAssignments.length === 0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal Control
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentDetail | null>(null);

  // Filters State
  const [filters, setFilters] = useState<AssignmentFilterState>({
    searchQuery: '',
    course: 'all',
    status: 'all',
    sortBy: 'newest',
  });

  // Fetch real enrolled assignments from backend API
  const fetchStudentAssignments = useCallback(async () => {
    try {
      const hasCachedData = Boolean(assignmentService.getCachedStudentEnrolledAssignments(courseId));
      if (!hasCachedData) {
        setIsLoading(true);
      }
      setHasError(false);
      setErrorMessage('');

      const res = await assignmentService.getStudentEnrolledAssignments(courseId);
      if (res.success && Array.isArray(res.data)) {
        setAssignments(res.data);
      } else if (!hasCachedData) {
        setAssignments([]);
        if (!res.success) {
          setHasError(true);
          setErrorMessage(res.message || 'Failed to retrieve your enrolled assignments.');
        }
      }
    } catch (err: any) {
      if (!assignmentService.getCachedStudentEnrolledAssignments(courseId)) {
        setHasError(true);
        setErrorMessage(err.message || 'Unable to connect to assignment server.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchStudentAssignments();
  }, [fetchStudentAssignments]);

  // Automatically select course in filter if courseId param is provided
  useEffect(() => {
    if (courseId && assignments.length > 0) {
      const match = assignments.find((a) => a.courseId === courseId);
      if (match) {
        setFilters((prev) => ({ ...prev, course: match.courseTitle }));
      }
    }
  }, [courseId, assignments]);

  // Unique Courses list
  const coursesList = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => set.add(a.courseTitle));
    return Array.from(set);
  }, [assignments]);

  // Statistics Metrics
  const totalCount = assignments.length;
  const pendingCount = useMemo(() => assignments.filter((a) => a.status === 'pending').length, [assignments]);
  const submittedCount = useMemo(() => assignments.filter((a) => a.status === 'submitted' || a.status === 'under_review').length, [assignments]);
  const gradedCount = useMemo(() => assignments.filter((a) => a.status === 'graded').length, [assignments]);

  const averageScore = useMemo(() => {
    const gradedItems = assignments.filter((a) => a.grade !== undefined);
    if (gradedItems.length === 0) return 0;
    const sum = gradedItems.reduce((acc, curr) => acc + (curr.grade || 0), 0);
    return Math.round((sum / (gradedItems.length * 100)) * 100);
  }, [assignments]);

  // Filter & Search Logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      // Search Query
      const matchesSearch =
        filters.searchQuery === '' ||
        asg.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        asg.courseTitle.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        asg.description.toLowerCase().includes(filters.searchQuery.toLowerCase());

      // Course Filter
      const matchesCourse = filters.course === 'all' || asg.courseTitle === filters.course;

      // Status Filter
      const matchesStatus = filters.status === 'all' || asg.status === filters.status;

      return matchesSearch && matchesCourse && matchesStatus;
    }).sort((a, b) => {
      if (filters.sortBy === 'oldest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      }
      if (filters.sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [assignments, filters]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      course: 'all',
      status: 'all',
      sortBy: 'newest',
    });
  };

  // Refresh
  const handleRefresh = () => {
    fetchStudentAssignments();
  };

  // Handle Real Submission from Modal via Backend API
  const handleSubmitAssignment = async (
    assignmentId: string,
    fileName: string,
    fileSize: string,
    submissionText?: string,
    storagePath?: string
  ) => {
    const textPayload = submissionText
      ? `${submissionText}\n[Attachment: ${fileName} (${fileSize})]`
      : `[Attachment: ${fileName} (${fileSize})]`;

    const res = await assignmentService.submitAssignment(assignmentId, {
      submissionText: textPayload,
      fileUrl: storagePath || '',
    });

    if (!res.success) {
      throw new Error(res.message || 'Failed to submit assignment');
    }

    // Refresh assignments from backend to get live database submission status
    await fetchStudentAssignments();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* 1. Assignment Header */}
      <AssignmentHeader
        totalCount={totalCount}
        pendingCount={pendingCount}
        submittedCount={submittedCount}
        gradedCount={gradedCount}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Progression Unlock / Review Banner */}
      {(() => {
        const hasSubmittedUnderReview = assignments.some(a => a.status === 'submitted' || a.status === 'under_review');
        const allMandatoryGradedAndPassed = assignments.length > 0 && assignments.every(a => a.status === 'graded' && (a.grade ?? 0) >= (a.passingMarks || 70));

        if (allMandatoryGradedAndPassed) {
          return (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-900/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl font-extrabold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                    All mandatory assignments graded & passed! Quizzes are now unlocked.
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Sequence requirement: Lessons (100%) → Assignments (Graded & Passed) → Take Quiz → Certificate.
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/student/quizzes')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shrink-0 text-xs shadow-sm"
              >
                <span>Take Quiz</span>
              </Button>
            </div>
          );
        }

        if (hasSubmittedUnderReview) {
          return (
            <div className="p-4 bg-amber-50/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl font-extrabold text-sm shrink-0">
                  ⏳
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                    Your assignment is under review. The quiz will be unlocked after your instructor publishes your assignment grade.
                  </span>
                  <span className="text-amber-800 dark:text-amber-300">
                    Take Quiz button is locked until your instructor evaluates your submission and awards passing marks.
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-60 cursor-not-allowed text-xs font-bold shrink-0"
              >
                <span>Take Quiz (Locked)</span>
              </Button>
            </div>
          );
        }

        return null;
      })()}

      {/* Loading Skeleton View */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : hasError ? (
        /* Error State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-4 max-w-xl mx-auto"
        >
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Unable to Load Assignments
          </h3>
          <p className="text-xs text-slate-500">
            {errorMessage || 'An error occurred while fetching your coursework assignments. Please try again.'}
          </p>
          <Button variant="primary" size="sm" onClick={handleRefresh} className="mx-auto">
            Retry Connection
          </Button>
        </motion.div>
      ) : assignments.length === 0 ? (
        /* Empty State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
        >
          <EmptyState
            type="courses"
            title="No assignments available."
            description="You currently have no pending, submitted, or graded coursework assignments across your enrolled masterclasses."
            actionLabel="Back to My Courses"
            onAction={() => navigate('/student/courses')}
          />
        </motion.div>
      ) : (
        /* Populated Assignments View */
        <div className="space-y-8">
          {/* 2. Statistics Cards */}
          <AssignmentStatsCards
            totalCount={totalCount}
            pendingCount={pendingCount}
            submittedCount={submittedCount}
            gradedCount={gradedCount}
            averageScore={averageScore}
            activeFilterStatus={filters.status}
            onSelectStatusFilter={(status) => setFilters({ ...filters, status })}
          />

          {/* 3. Search & Filter Bar */}
          <AssignmentFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            courses={coursesList}
            totalFilteredCount={filteredAssignments.length}
          />

          {/* Main Grid: Assignment Cards List + Upcoming Deadlines Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Assignment Cards Grid */}
            <div className="lg:col-span-8">
              {filteredAssignments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                  <EmptyState
                    type="courses"
                    title="No assignments match your filters"
                    description="Try clearing your search terms or expanding status options to find your coursework."
                    actionLabel="Reset Search Filters"
                    onAction={handleResetFilters}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredAssignments.map((assignment) => (
                    <motion.div key={assignment.id} layout>
                      <AssignmentCard
                        assignment={assignment}
                        onOpenDetails={(asg) => setSelectedAssignment(asg)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar: Upcoming Deadlines */}
            <div className="lg:col-span-4 space-y-6">
              <UpcomingDeadlinesSidebar
                assignments={assignments}
                onOpenDetails={(asg) => setSelectedAssignment(asg)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Assignment Details & Submission Workspace Modal */}
      <ErrorBoundary onReset={() => setSelectedAssignment(null)}>
        <AssignmentDetailsModal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          assignment={selectedAssignment}
          onSubmitAssignment={handleSubmitAssignment}
        />
      </ErrorBoundary>
    </motion.div>
  );
};

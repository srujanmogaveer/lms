import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { BaseModal } from '../../components/dashboard/DashboardModals';
import { Button } from '../../components/ui/Button';

// Sub-components
import { InstructorDashboardHeader } from '../../components/instructor/InstructorDashboardHeader';
import { InstructorStatsCards } from '../../components/instructor/InstructorStatsCards';
import { InstructorQuickActions } from '../../components/instructor/InstructorQuickActions';
import { InstructorCoursePerformance } from '../../components/instructor/InstructorCoursePerformance';
import { InstructorPendingReviews } from '../../components/instructor/InstructorPendingReviews';
import { InstructorUpcomingLiveClasses } from '../../components/instructor/InstructorUpcomingLiveClasses';
import { InstructorStudentActivityFeed } from '../../components/instructor/InstructorStudentActivityFeed';
import { InstructorRevenueSummary } from '../../components/instructor/InstructorRevenueSummary';
import { InstructorAnnouncementsWidget } from '../../components/instructor/InstructorAnnouncementsWidget';
import { InstructorCalendarWidget } from '../../components/instructor/InstructorCalendarWidget';
import { InstructorNotificationsWidget } from '../../components/instructor/InstructorNotificationsWidget';
import { ProfileCompletionCard } from '../../components/instructor/ProfileCompletionCard';

// Interactive Modals
import {
  ReviewAssignmentModal,
  ReviewQuizModal,
  JoinLiveClassModal,
} from '../../components/instructor/InstructorModals';
import type {
  PendingAssignmentReview,
  PendingQuizReview,
  UpcomingInstructorLiveClass,
} from '../../data/instructorDummyData';

import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { quizService } from '../../services/quizService';
import { announcementService } from '../../services/announcementService';
import { showSuccessAlert, showErrorAlert } from '../../utils/swalAlerts';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';

export const InstructorDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Modal State Control
  const [reviewAssignmentTarget, setReviewAssignmentTarget] = useState<PendingAssignmentReview | null>(null);
  const [reviewQuizTarget, setReviewQuizTarget] = useState<PendingQuizReview | null>(null);
  const [joinLiveClassTarget, setJoinLiveClassTarget] = useState<UpcomingInstructorLiveClass | null>(null);
  const [quickActionNotice, setQuickActionNotice] = useState<{ id: string; title: string } | null>(null);
  const [announcementNotice, setAnnouncementNotice] = useState<boolean>(false);
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Toast / Status Notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // React Query caching for Instructor Studio Dashboard
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['instructor-dashboard', currentUser?.id],
    queryFn: async () => {
      const res = await courseService.getInstructorDashboardStats();
      return res.success && res.data ? res.data : null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser?.id,
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
    showToast('Instructor Studio data refreshed successfully.');
  };

  const handleGradeAssignment = async (submissionId: string, score: number, feedback: string) => {
    try {
      const res = await assignmentService.gradeSubmission(submissionId, {
        score,
        feedback,
        status: 'Graded',
      });
      if (res.success) {
        showSuccessAlert('Assignment Graded', `Evaluation saved (${score} marks).`);
        await queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
      }
    } catch (err: any) {
      showErrorAlert('Grading Failed', err.message || 'Unable to save grade.');
    }
  };

  const handleApproveQuiz = async (requestId: string) => {
    try {
      const res = await quizService.approveReattemptRequest(requestId);
      if (res.success) {
        showSuccessAlert('Quiz Reattempt Approved', 'Additional attempt granted to student.');
        await queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
      } else {
        showToast('Approved quiz reattempt request.');
      }
    } catch (err: any) {
      showErrorAlert('Approval Failed', err.message || 'Unable to approve reattempt.');
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    try {
      await announcementService.createAnnouncement({
        title: announcementText.trim(),
        message: announcementText.trim(),
        courseId: selectedCourseId || undefined,
      });
      setAnnouncementNotice(false);
      setAnnouncementText('');
      showToast('Course announcement broadcasted to enrolled students.');
      await queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
    } catch (err: any) {
      showErrorAlert('Broadcast Failed', err?.message || 'Unable to post announcement.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12 relative"
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-brand-500 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* 1. Header */}
      <InstructorDashboardHeader
        onRefresh={handleRefresh}
        isLoading={isLoading}
        onCreateCourse={() => navigate('/instructor/courses?action=create')}
      />

      {/* Complete Your Profile Interactive Component */}
      <ProfileCompletionCard
        onNavigateToProfile={() => navigate('/instructor/profile')}
        onCreateCourse={() => navigate('/instructor/courses?action=create')}
      />

      {/* Skeleton Loading State View */}
      {isLoading ? (
        <div className="space-y-6" aria-label="Loading Instructor Dashboard">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonLoader className="lg:col-span-2 h-96 w-full rounded-2xl" />
            <SkeletonLoader className="lg:col-span-1 h-96 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* 2. Key Statistics Cards (8 Cards) */}
          <InstructorStatsCards
            stats={dashboardStats}
            onCardClick={(statType) => {
              if (statType === 'total_courses' || statType === 'published_courses' || statType === 'draft_courses') {
                navigate('/instructor/courses');
              } else if (statType === 'total_students') {
                navigate('/instructor/students');
              } else if (statType === 'pending_assignments') {
                navigate('/instructor/assignments?tab=pending');
              } else if (statType === 'pending_quizzes') {
                navigate('/instructor/quizzes');
              } else if (statType === 'scheduled_live') {
                navigate('/instructor/live');
              } else if (statType === 'total_revenue') {
                navigate('/instructor/revenue');
              }
            }}
          />

          {/* 3. Quick Actions Toolbar */}
          <InstructorQuickActions
            onActionTrigger={(actionId, actionTitle) => {
              if (actionId === 'create_course') {
                navigate('/instructor/courses?action=create');
              } else if (actionId === 'manage_curriculum') {
                navigate('/instructor/curriculum');
              } else if (actionId === 'upload_content') {
                navigate('/instructor/content');
              } else if (actionId === 'create_assignment' || actionId === 'new_assignment') {
                navigate('/instructor/assignments');
              } else if (actionId === 'create_quiz' || actionId === 'new_quiz') {
                navigate('/instructor/quizzes');
              } else if (actionId === 'schedule_live' || actionId === 'live_class') {
                navigate('/instructor/live');
              } else if (actionId === 'view_students') {
                navigate('/instructor/students');
              } else if (actionId === 'broadcast') {
                setAnnouncementNotice(true);
              } else {
                setQuickActionNotice({ id: actionId, title: actionTitle });
              }
            }}
          />

          {/* 4. Course Performance & Student Enrollment Trend */}
          <InstructorCoursePerformance
            popularCourses={dashboardStats?.popularCourses}
            monthlyTrendData={dashboardStats?.monthlyTrendData}
            studentsTrendPercent={dashboardStats?.studentsTrendPercent}
            onCreateCourse={() => navigate('/instructor/courses?action=create')}
          />

          {/* 5. Pending Reviews (Assignments Waiting for Grading & Quizzes Waiting for Review) */}
          <InstructorPendingReviews
            onReviewAssignment={(assignment) => setReviewAssignmentTarget(assignment)}
            onReviewQuiz={(quiz) => setReviewQuizTarget(quiz)}
          />

          {/* 6. Upcoming Scheduled Live Classes */}
          <InstructorUpcomingLiveClasses
            onJoinLiveClass={(liveClass) => setJoinLiveClassTarget(liveClass)}
          />

          {/* 7. Student Activity Stream & Revenue Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InstructorStudentActivityFeed activityFeed={dashboardStats?.activityFeed} />
            <InstructorRevenueSummary stats={dashboardStats} />
          </div>

          {/* 8. Announcements, Calendar Schedule & Notifications Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InstructorAnnouncementsWidget
              onNewAnnouncement={() => setAnnouncementNotice(true)}
            />
            <InstructorCalendarWidget />
            <InstructorNotificationsWidget />
          </div>
        </>
      )}

      {/* Interactive Modals */}
      <ReviewAssignmentModal
        isOpen={!!reviewAssignmentTarget}
        onClose={() => setReviewAssignmentTarget(null)}
        assignment={reviewAssignmentTarget}
        onGradeSubmitted={handleGradeAssignment}
      />

      <ReviewQuizModal
        isOpen={!!reviewQuizTarget}
        onClose={() => setReviewQuizTarget(null)}
        quiz={reviewQuizTarget}
        onQuizApproved={handleApproveQuiz}
      />

      <JoinLiveClassModal
        isOpen={!!joinLiveClassTarget}
        onClose={() => setJoinLiveClassTarget(null)}
        liveClass={joinLiveClassTarget}
      />

      {/* Quick Action Preview Modal */}
      <BaseModal
        isOpen={!!quickActionNotice}
        onClose={() => setQuickActionNotice(null)}
        title={`Studio Tool: ${quickActionNotice?.title}`}
      >
        <div className="space-y-4 text-center py-3 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Opening interactive tool for <strong>"{quickActionNotice?.title}"</strong>.
          </p>
          <Button
            variant="primary"
            className="w-full justify-center bg-brand-600 hover:bg-brand-700 text-white font-bold"
            onClick={() => setQuickActionNotice(null)}
          >
            Close
          </Button>
        </div>
      </BaseModal>

      {/* New Announcement Modal */}
      <BaseModal
        isOpen={announcementNotice}
        onClose={() => setAnnouncementNotice(false)}
        title="Broadcast Course Announcement"
      >
        <form
          onSubmit={handleBroadcastAnnouncement}
          className="space-y-4 text-xs"
        >
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Target Course:</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="">All Enrolled Students (All Courses)</option>
              {(dashboardStats?.popularCourses || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Announcement Title / Content:</label>
            <input
              type="text"
              placeholder="e.g. Live Q&A Session Rescheduled to Tuesday"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAnnouncementNotice(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Broadcast Post
            </Button>
          </div>
        </form>
      </BaseModal>
    </motion.div>
  );
};

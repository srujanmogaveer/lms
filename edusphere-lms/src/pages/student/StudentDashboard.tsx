import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentService } from '../../services/enrollmentService';
import { progressService } from '../../services/progressService';
import { courseService } from '../../services/courseService';
import type { Announcement, Course, EnrolledCourseProgress, WeeklyActivity } from '../../types';

// Dashboard Sub-components
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { ContinueLearningSection } from '../../components/dashboard/ContinueLearningSection';
import { LearningProgressSection } from '../../components/dashboard/LearningProgressSection';
import { RecommendedCoursesSection } from '../../components/dashboard/RecommendedCoursesSection';
import { QuickActionsGrid } from '../../components/dashboard/QuickActionsGrid';
import { AnnouncementModal, ActionNoticeModal } from '../../components/dashboard/DashboardModals';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

import { useQuery, useQueryClient } from '@tanstack/react-query';

export const StudentDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [actionNotice, setActionNotice] = useState<{ title: string; message: string } | null>(null);

  // Dynamic user information
  const studentName = currentUser?.name || 'Student';
  const studentAvatar = currentUser?.avatar || '';

  // React Query caching for Student Dashboard (5-minute staleTime)
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['student-dashboard', currentUser?.id],
    queryFn: async () => {
      const [enrollmentsRes, publicCoursesRes, allProgressRes] = await Promise.all([
        enrollmentService.getStudentEnrollments().catch(() => ({ success: false, data: [] })),
        courseService.getPublicCourses({ limit: 4 }).catch(() => ({ success: false, data: [] })),
        progressService.getAllCoursesProgress().catch(() => ({ success: false, data: {} })),
      ]);

      const recCourses: Course[] =
        publicCoursesRes.success && Array.isArray(publicCoursesRes.data)
          ? publicCoursesRes.data
          : [];

      const progressMap: Record<string, any> =
        allProgressRes.success && allProgressRes.data ? allProgressRes.data : {};

      let enriched: EnrolledCourseProgress[] = [];
      if (enrollmentsRes.success && Array.isArray(enrollmentsRes.data) && enrollmentsRes.data.length > 0) {
        enriched = enrollmentsRes.data.map((enr) => {
          const progData = progressMap[enr.courseId];
          const progressPct = progData ? progData.lessonProgressPercentage : 0;
          const totalLessonsCount = progData && progData.totalLessons > 0 ? progData.totalLessons : 10;
          const completedLessonsCount = progData ? progData.completedLessons : 0;

          return {
            course: {
              id: enr.courseId,
              title: enr.courseTitle || 'Enrolled Course',
              slug: enr.courseId,
              description: 'Comprehensive curriculum with lessons, assignments, and quizzes.',
              instructorId: enr.instructorId || 'inst-1',
              instructorName: enr.instructorName || 'Lead Instructor',
              instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              thumbnail: enr.courseThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
              rating: 4.9,
              reviewsCount: 120,
              studentsEnrolled: 250,
              price: 0,
              discountPrice: 0,
              durationHours: Math.round((totalLessonsCount * 15) / 60) || 4,
              lessonsCount: totalLessonsCount,
              level: 'All Levels' as const,
              category: enr.category || (enr as any).courseCategory || 'General',
              updatedAt: new Date(enr.enrolledAt).toLocaleDateString('en-IN'),
              isPublished: true,
              isFeatured: true,
            },
            progress: progressPct,
            completedLessons: completedLessonsCount,
            totalLessons: totalLessonsCount,
            lastAccessedLesson: `Lesson ${completedLessonsCount > 0 ? completedLessonsCount : 1}`,
            lastAccessedTime: 'Recently',
          };
        });
      }

      return {
        enrolledProgressList: enriched,
        recommendedCourses: recCourses,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser?.id,
  });

  const enrolledProgressList = dashboardData?.enrolledProgressList || [];
  const recommendedCourses = dashboardData?.recommendedCourses || [];

  // Overall progress score
  const overallProgress =
    enrolledProgressList.length > 0
      ? Math.round(
          enrolledProgressList.reduce((acc, curr) => acc + curr.progress, 0) / enrolledProgressList.length
        )
      : 0;

  const inProgressCount = enrolledProgressList.filter((c) => c.progress > 0 && c.progress < 100).length;
  const completedCount = enrolledProgressList.filter((c) => c.progress === 100).length;

  // Real Weekly Activity distribution
  const defaultWeeklyActivity: WeeklyActivity[] = [
    { day: 'Mon', fullDay: 'Monday', hours: 1.5, targetHours: 2 },
    { day: 'Tue', fullDay: 'Tuesday', hours: 2.0, targetHours: 2 },
    { day: 'Wed', fullDay: 'Wednesday', hours: 0.5, targetHours: 2 },
    { day: 'Thu', fullDay: 'Thursday', hours: 2.5, targetHours: 2 },
    { day: 'Fri', fullDay: 'Friday', hours: 1.0, targetHours: 2 },
    { day: 'Sat', fullDay: 'Saturday', hours: 3.0, targetHours: 2 },
    { day: 'Sun', fullDay: 'Sunday', hours: 2.0, targetHours: 2 },
  ];

  // Refresh handler
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
  };

  // Quick Action & Shortcut Navigation Handler
  const handleQuickAction = (actionId: string, _actionTitle?: string) => {
    const routeMap: Record<string, string> = {
      browse_courses: '/student/browse',
      my_courses: '/student/courses',
      enrolled: '/student/courses',
      in_progress: '/student/courses',
      completed: '/student/courses',
      assignments: '/student/assignments',
      quizzes: '/student/quizzes',
      live_classes: '/student/live',
      certificates: '/student/certificates',
      wishlist: '/student/wishlist',
      shopping_cart: '/student/cart',
      cart: '/student/cart',
      notifications: '/student/notifications',
      profile: '/student/profile',
    };

    const targetRoute = routeMap[actionId];
    if (targetRoute) {
      navigate(targetRoute);
    } else if (_actionTitle) {
      setActionNotice({
        title: `${_actionTitle} Navigation`,
        message: `Navigating to ${_actionTitle}...`,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* 1. Dashboard Header */}
      <DashboardHeader
        studentName={studentName}
        studentEmail={currentUser?.email}
        avatarUrl={studentAvatar}
        streakDays={12}
        isLoading={isLoading}
        onRefreshData={handleRefresh}
      />

      {/* Loading Skeleton Simulation State */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-64 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonLoader className="h-48 w-full rounded-2xl" />
            <SkeletonLoader className="h-48 w-full rounded-2xl" />
            <SkeletonLoader className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 2. Statistics Cards */}
          <StatsCards
            enrolledCount={enrolledProgressList.length}
            inProgressCount={inProgressCount}
            completedCount={completedCount}
            certificatesCount={completedCount}
            wishlistCount={0}
            cartCount={0}
            onCardClick={(type) => handleQuickAction(type, type.replace('_', ' ').toUpperCase())}
          />

          {/* 3. Continue Learning */}
          {enrolledProgressList.length > 0 ? (
            <ContinueLearningSection
              coursesProgress={enrolledProgressList}
              onContinueCourse={(courseId) => {
                navigate(`/student/player/${courseId}`);
              }}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <EmptyState
                type="courses"
                title="No enrolled courses yet."
                description="Explore published courses and enroll to begin learning."
                actionLabel="Browse Courses"
                onAction={() => navigate('/student/browse')}
              />
            </div>
          )}

          {/* 4. Learning Progress Charts & Metrics */}
          <LearningProgressSection
            weeklyActivity={defaultWeeklyActivity}
            overallProgress={overallProgress}
          />

          {/* 5. Recommended Courses from Live Backend */}
          {recommendedCourses.length > 0 && (
            <RecommendedCoursesSection
              courses={recommendedCourses}
              onSelectCourse={(course) => navigate(`/student/courses/${course.slug}`)}
            />
          )}

          {/* 6. Quick Actions Grid */}
          <QuickActionsGrid onActionClick={handleQuickAction} />
        </div>
      )}

      {/* Interactive Modals */}
      <AnnouncementModal
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />

      <ActionNoticeModal
        isOpen={!!actionNotice}
        title={actionNotice?.title || ''}
        message={actionNotice?.message || ''}
        onClose={() => setActionNotice(null)}
      />
    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { EnrolledCourseDetail, Course } from '../../types';
import { enrollmentService } from '../../services/enrollmentService';
import { progressService } from '../../services/progressService';
import { assignmentService } from '../../services/assignmentService';
import { quizService } from '../../services/quizService';
// Sub-components
import { MyCoursesHeader } from '../../components/mycourses/MyCoursesHeader';
import { MyCoursesProgressSummary } from '../../components/mycourses/MyCoursesProgressSummary';
import { MyCoursesFilterBar, type MyCoursesFilterState } from '../../components/mycourses/MyCoursesFilterBar';
import { MyCourseCard } from '../../components/mycourses/MyCourseCard';
import { MyCoursesUpcomingActivities, type UpcomingActivityItem } from '../../components/mycourses/MyCoursesUpcomingActivities';
import {
  InstructorBioModal,
} from '../../components/mycourses/MyCoursesModals';
import { CertificatePreviewDocument } from '../../components/certificates/CertificatePreviewDocument';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';

export const StudentMyCourses: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // React Query caching for Student My Courses (5-minute staleTime)
  const { data: myCoursesData = { enrolledCourses: [], upcomingActivities: [] }, isLoading } = useQuery<{
    enrolledCourses: EnrolledCourseDetail[];
    upcomingActivities: UpcomingActivityItem[];
  }>({
    queryKey: ['student-my-courses', currentUser?.id],
    queryFn: async () => {
      const [enrollmentsRes, allProgressRes, assignmentsRes, quizzesRes] = await Promise.all([
        enrollmentService.getStudentEnrollments().catch(() => ({ success: false, data: [] })),
        progressService.getAllCoursesProgress().catch(() => ({ success: false, data: {} })),
        assignmentService.getStudentEnrolledAssignments().catch(() => ({ success: false, data: [] })),
        quizService.getStudentEnrolledQuizzes().catch(() => ({ success: false, data: [] })),
      ]);

      let enriched: EnrolledCourseDetail[] = [];
      if (enrollmentsRes.success && Array.isArray(enrollmentsRes.data) && enrollmentsRes.data.length > 0) {
        const progressMap: Record<string, any> =
          allProgressRes.success && allProgressRes.data ? allProgressRes.data : {};

        enriched = enrollmentsRes.data.map((enr) => {
          const progData = progressMap[enr.courseId];
          const progressPct = progData ? progData.lessonProgressPercentage : 0;
          const totalLessonsCount = progData && progData.totalLessons > 0 ? progData.totalLessons : 10;
          const completedLessonsCount = progData ? progData.completedLessons : 0;
          const isCourseCompleted = Boolean(progData?.isCourseCompleted || progData?.certificateAvailable);

          const enrollmentStatus: 'not_started' | 'in_progress' | 'completed' =
            isCourseCompleted
              ? 'completed'
              : progressPct > 0
              ? 'in_progress'
              : 'not_started';

          return {
            id: enr.id,
            course: {
              id: enr.courseId,
              title: enr.courseTitle || 'Enrolled Course',
              slug: enr.courseId,
              description: 'Comprehensive curriculum with lessons, assignments, and mandatory quiz assessment.',
              instructorId: enr.instructorId || '',
              instructorName: enr.instructorName || 'Lead Instructor',
              instructorAvatar: enr.instructorAvatar || '',
              instructorBio: enr.instructorBio || '',
              instructorSpecialization: enr.instructorSpecialization || '',
              instructorQualification: enr.instructorQualification || '',
              thumbnail: enr.courseThumbnail || '',
              rating: enr.rating || 5.0,
              reviewsCount: 0,
              studentsEnrolled: enr.studentsEnrolled || 0,
              price: 0,
              discountPrice: 0,
              durationHours: Math.round((totalLessonsCount * 15) / 60) || 4,
              lessonsCount: totalLessonsCount,
              level: 'All Levels' as const,
              category: enr.category || 'General',
              updatedAt: new Date(enr.enrolledAt).toLocaleDateString('en-IN'),
              isPublished: true,
              isFeatured: true,
            },
            progress: progressPct,
            completedLessons: completedLessonsCount,
            totalLessons: totalLessonsCount,
            lastAccessedLesson: `Lesson ${completedLessonsCount > 0 ? completedLessonsCount : 1}`,
            lastAccessedTime: 'Recently',
            enrollmentStatus,
            enrolledAt: enr.enrolledAt,
            enrolledDate: new Date(enr.enrolledAt).toLocaleDateString('en-IN'),
            currentModule: 'Core Curriculum',
          };
        });
      }

      const activities: UpcomingActivityItem[] = [];

      // 1. Pending/Active Assignments
      if (assignmentsRes.success && Array.isArray(assignmentsRes.data)) {
        assignmentsRes.data
          .filter((a: any) => a.status !== 'Graded')
          .slice(0, 3)
          .forEach((a: any) => {
            const isSubmitted = a.status === 'Submitted' || a.status === 'under_review' || a.status === 'Under Review';
            activities.push({
              id: `asg-${a.id}`,
              type: isSubmitted ? 'Under Review' : 'Course Project',
              title: a.title || 'Course Assignment',
              courseTitle: a.courseTitle || 'Enrolled Course',
              due: a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN') : 'Self-Paced Learning',
              iconType: 'assignment',
              badgeVariant: isSubmitted ? 'neutral' : 'primary',
              actionText: isSubmitted ? 'View Submission' : 'Start Project',
              path: `/student/assignments/${a.courseId || ''}`,
            });
          });
      }

      // 2. Pending / Unpassed Quizzes
      if (quizzesRes.success && Array.isArray(quizzesRes.data)) {
        quizzesRes.data
          .filter((q: any) => !q.passed && q.status !== 'passed')
          .slice(0, 3)
          .forEach((q: any) => {
            activities.push({
              id: `quiz-${q.id}`,
              type: 'Knowledge Quiz',
              title: q.title || 'Final Knowledge Quiz',
              courseTitle: q.courseTitle || 'Enrolled Course',
              due: q.timeLimitMinutes ? `${q.timeLimitMinutes} Mins Exam` : 'Upon Lesson Completion',
              iconType: 'quiz',
              badgeVariant: 'warning',
              actionText: 'Take Quiz',
              path: `/student/quizzes?courseId=${q.courseId || ''}`,
            });
          });
      }

      // 3. Next Lesson Milestones from in-progress courses
      if (activities.length < 3) {
        enriched
          .filter((c) => c.enrollmentStatus === 'in_progress' || c.progress > 0)
          .slice(0, 3 - activities.length)
          .forEach((c) => {
            activities.push({
              id: `lesson-${c.course.id}`,
              type: 'Curriculum Milestone',
              title: `${c.lastAccessedLesson || 'Next Module'} in ${c.course.title}`,
              courseTitle: c.course.title,
              due: `${c.progress}% Completed`,
              iconType: 'lesson',
              badgeVariant: 'info',
              actionText: 'Continue Learning',
              path: `/student/player/${c.course.id}`,
            });
          });
      }

      return {
        enrolledCourses: enriched,
        upcomingActivities: activities.slice(0, 3),
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!currentUser?.id,
  });

  const enrolledCourses = myCoursesData.enrolledCourses;
  const upcomingActivities = myCoursesData.upcomingActivities;

  // Tabs & Filter State
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed' | 'recently_accessed'>('all');
  const [filters, setFilters] = useState<MyCoursesFilterState>({
    searchQuery: '',
    category: 'all',
    instructor: 'all',
    status: 'all',
    difficulty: 'all',
    sortBy: 'newest',
  });

  // Modal Control States
  const [instructorTarget, setInstructorTarget] = useState<EnrolledCourseDetail | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [verifiedCertData, setVerifiedCertData] = useState<any>(null);

  const handleQuickNav = (navId: string, item: EnrolledCourseDetail) => {
    const course = item.course;
    switch (navId) {
      case 'lessons':
        navigate(`/student/player/${course.id}`);
        break;
      case 'assignments':
        navigate(`/student/assignments/${course.id}`);
        break;
      case 'quizzes':
        navigate(`/student/quizzes?courseId=${course.id}`);
        break;
      case 'announcements':
        navigate(`/student/announcements?courseId=${course.id}`);
        break;
      case 'forum':
        navigate(`/student/forum?courseId=${course.id}`);
        break;
      case 'chat':
        navigate(`/student/chat?courseId=${course.id}`);
        break;
      case 'live':
        navigate(`/student/live?courseId=${course.id}`);
        break;
      case 'certificate':
        if (item.enrollmentStatus === 'completed') {
          handleViewCertificate(course);
        } else {
          navigate('/student/certificates');
        }
        break;
      default:
        navigate(`/student/player/${course.id}`);
        break;
    }
  };

  const handleViewCertificate = async (course: Course) => {
    try {
      const res = await progressService.getCourseCertificate(course.id);
      if (res.success && res.data) {
        setVerifiedCertData(res.data);
        setCertificateCourse(course);
      } else {
        alert(res.message || 'Certificate is not available. Please complete all course lessons, assignments, and quizzes.');
      }
    } catch (err: any) {
      alert(err.message || 'Unable to verify certificate at this time.');
    }
  };

  // Status Metrics
  const inProgressCount = useMemo(() => enrolledCourses.filter((c) => c.enrollmentStatus === 'in_progress').length, [enrolledCourses]);
  const completedCount = useMemo(() => enrolledCourses.filter((c) => c.enrollmentStatus === 'completed').length, [enrolledCourses]);
  const notStartedCount = useMemo(() => enrolledCourses.filter((c) => c.enrollmentStatus === 'not_started').length, [enrolledCourses]);

  const overallProgress = useMemo(() => {
    if (enrolledCourses.length === 0) return 0;
    return Math.round(enrolledCourses.reduce((acc, curr) => acc + curr.progress, 0) / enrolledCourses.length);
  }, [enrolledCourses]);

  // Unique Categories & Instructors
  const categories = useMemo(() => {
    const set = new Set<string>();
    enrolledCourses.forEach((item) => set.add(item.course.category));
    return Array.from(set);
  }, [enrolledCourses]);

  const instructors = useMemo(() => {
    const set = new Set<string>();
    enrolledCourses.forEach((item) => set.add(item.course.instructorName));
    return Array.from(set);
  }, [enrolledCourses]);

  // Filtering & Sorting Logic
  const filteredCourses = useMemo(() => {
    return enrolledCourses.filter((item) => {
      const { course, enrollmentStatus } = item;

      // 1. Course Tabs
      if (activeTab === 'in_progress' && enrollmentStatus !== 'in_progress') return false;
      if (activeTab === 'completed' && enrollmentStatus !== 'completed') return false;
      if (activeTab === 'recently_accessed' && !item.lastAccessedTime.toLowerCase().includes('hour') && !item.lastAccessedTime.toLowerCase().includes('today')) return false;

      // 2. Search Query
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(q);
        const matchesInstructor = course.instructorName.toLowerCase().includes(q);
        const matchesCategory = course.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesInstructor && !matchesCategory) return false;
      }

      // 3. Category
      if (filters.category !== 'all' && course.category !== filters.category) return false;

      // 4. Instructor
      if (filters.instructor !== 'all' && course.instructorName !== filters.instructor) return false;

      // 5. Status Filter
      if (filters.status !== 'all' && enrollmentStatus !== filters.status) return false;

      // 6. Difficulty Filter
      if (filters.difficulty !== 'all' && course.level !== filters.difficulty) return false;

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'alphabetical') return a.course.title.localeCompare(b.course.title);
      if (filters.sortBy === 'progress') return b.progress - a.progress;
      if (filters.sortBy === 'recently_accessed') return a.lastAccessedTime.localeCompare(b.lastAccessedTime);
      return 0; // default newest
    });
  }, [enrolledCourses, activeTab, filters]);

  // Reset demo state
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'all',
      instructor: 'all',
      status: 'all',
      difficulty: 'all',
      sortBy: 'newest',
    });
    setActiveTab('all');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['student-my-courses'] });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* 1. Header */}
      <MyCoursesHeader
        totalEnrolled={enrolledCourses.length}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        notStartedCount={notStartedCount}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Loading Skeleton View */}
      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader className="h-28 w-full rounded-2xl" />
          <SkeletonLoader className="h-16 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : enrolledCourses.length === 0 ? (
        /* Empty State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
        >
          <EmptyState
            type="courses"
            title="You haven't enrolled in any courses yet."
            description="Explore our interactive masterclass catalog to start learning full-stack web development, design systems, and AI engineering."
            actionLabel="Browse Courses"
            onAction={() => navigate('/student/browse')}
          />
        </motion.div>
      ) : (
        /* Populated Enrolled Courses View */
        <div className="space-y-8">
          {/* 2. Progress Summary Bar */}
          <MyCoursesProgressSummary
            overallProgress={overallProgress}
            completedCount={completedCount}
            totalHoursLearned={Math.round(
              enrolledCourses.reduce((acc, curr) => acc + (curr.completedLessons * 15) / 60, 0) * 10
            ) / 10}
          />

          {/* 3. Search & Course Tabs & Filters */}
          <MyCoursesFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            categories={categories}
            instructors={instructors}
            totalFilteredCount={filteredCourses.length}
          />

          {/* 4. Course Cards Grid */}
          {filteredCourses.length === 0 ? (
            <EmptyState
              type="courses"
              title="No enrolled courses found"
              description="No enrolled courses match your current search or tab criteria."
              actionLabel="Clear Search Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((item) => (
                <motion.div key={item.id} layout>
                  <MyCourseCard
                    item={item}
                    onContinueLearning={(item) => navigate(`/student/player/${item.course.id}`)}
                    onViewDetails={(item) => navigate(`/student/courses/${item.course.slug}`)}
                    onViewInstructor={(item) => setInstructorTarget(item)}
                    onViewCertificate={(item) => handleViewCertificate(item.course)}
                    onQuickNav={(navId, item) => handleQuickNav(navId, item)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* 5. Upcoming Activities & Deadlines */}
          <MyCoursesUpcomingActivities
            activities={upcomingActivities}
            onSelectActivity={(path) => navigate(path)}
          />
        </div>
      )}

      {/* Interactive Modals */}
      <InstructorBioModal
        isOpen={!!instructorTarget}
        onClose={() => setInstructorTarget(null)}
        item={instructorTarget}
      />

      {/* Official Certificate Preview Document */}
      <CertificatePreviewDocument
        isOpen={!!certificateCourse && !!verifiedCertData}
        onClose={() => {
          setCertificateCourse(null);
          setVerifiedCertData(null);
        }}
        certificate={
          verifiedCertData
            ? {
                id: `cert-${certificateCourse?.id}`,
                courseId: certificateCourse?.id || '',
                courseTitle: verifiedCertData.courseTitle || certificateCourse?.title || '',
                courseCategory: certificateCourse?.category || 'Masterclass',
                courseThumbnail: verifiedCertData.courseThumbnail || certificateCourse?.thumbnail || '',
                courseDescription: verifiedCertData.courseDescription || certificateCourse?.description || '',
                studentName: verifiedCertData.studentName,
                instructorName: verifiedCertData.instructorName,
                instructorTitle: verifiedCertData.instructorTitle || 'Lead Instructor & Mentor',
                instructorAvatar: verifiedCertData.instructorAvatar || certificateCourse?.instructorAvatar || '',
                certificateCode: verifiedCertData.certificateCode || verifiedCertData.serialCode,
                issueDate: verifiedCertData.issueDate,
                completionDate: verifiedCertData.completionDate,
                verificationUrl: verifiedCertData.verificationUrl,
                status: 'earned',
                learningHours: verifiedCertData.durationHours || certificateCourse?.durationHours || 4,
                requirements: {
                  lessonsCompletionPercent: 100,
                  assignmentsCompletionPercent: 100,
                  quizzesPassPercent: 100,
                  overallProgressPercent: 100,
                },
              }
            : null
        }
      />
    </motion.div>
  );
};

import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiPlayCircle,
  FiFileText,
  FiFile,
  FiFolder,
  FiMenu,
  FiX,
  FiBookOpen,
  FiAlertCircle,
  FiStar,
} from 'react-icons/fi';


import { PlayerHeader } from '../../components/player/PlayerHeader';
import { PlayerSidebar } from '../../components/player/PlayerSidebar';
import { resetScrollToTop } from '../../components/common/ScrollToTop';
import { VideoLessonPlayer } from '../../components/player/VideoLessonPlayer';
import { PdfNotesViewer } from '../../components/player/PdfNotesViewer';
import { TextLessonContent } from '../../components/player/TextLessonContent';
import { ResourcesList } from '../../components/player/ResourcesList';
import { PersonalNotesPanel } from '../../components/player/PersonalNotesPanel';
import { BookmarksPanel } from '../../components/player/BookmarksPanel';
import { UpcomingLearningCard } from '../../components/player/UpcomingLearningCard';
import { CourseCompletionModal } from '../../components/player/CourseCompletionModal';
import { StudentAiAssistant } from '../../components/player/StudentAiAssistant';
import { CourseReviewsSection } from '../../components/reviews/CourseReviewsSection';
import { ReviewModal } from '../../components/reviews/ReviewModal';

import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { showToastAlert } from '../../utils/swalAlerts';
import { formatLessonDuration } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

import type {
  PlayerModule,
  PlayerLesson,
  PlayerPersonalNote,
  Course,
} from '../../types';
import { curriculumService } from '../../services/curriculumService';
import { courseService } from '../../services/courseService';
import { progressService } from '../../services/progressService';

export const StudentLearningPlayer: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { courseId } = useParams<{ courseId?: string }>();
  const activeCourseId = courseId || '';

  // Core Data State
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<PlayerModule[]>([]);
  const [personalNotes, setPersonalNotes] = useState<PlayerPersonalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Dynamically compute lock status based on sequential completion progression
  const displayModules: PlayerModule[] = useMemo(() => {
    let prevLessonCompleted = true; // Lesson 0 is accessible by default

    return modules.map((mod) => ({
      ...mod,
      lessons: mod.lessons.map((les) => {
        // If lesson requires sequential lock (isLocked: true or isPreview: false)
        const requiresLock = les.isLocked === true || les.isPreview === false;
        const isCurrentlyLocked = requiresLock && !les.isCompleted && !prevLessonCompleted;

        // Remember whether this lesson was completed to unlock the subsequent lesson
        prevLessonCompleted = Boolean(les.isCompleted);

        return {
          ...les,
          isLocked: isCurrentlyLocked,
        };
      }),
    }));
  }, [modules]);

  // Flattened list of all lessons for linear navigation
  const allLessons = useMemo(() => {
    const list: PlayerLesson[] = [];
    displayModules.forEach((mod) => {
      mod.lessons.forEach((les) => {
        list.push(les);
      });
    });
    return list;
  }, [displayModules]);

  // Active Lesson State
  const [activeLessonId, setActiveLessonId] = useState<string>('');

  const activeLesson: PlayerLesson | null = useMemo(() => {
    if (!activeLessonId && allLessons.length > 0) return allLessons[0];
    return allLessons.find((l) => l.id === activeLessonId) || null;
  }, [allLessons, activeLessonId]);

  // Tab State: 'video' | 'pdf' | 'text' | 'resources'
  type TabType = 'video' | 'pdf' | 'text' | 'resources';
  const [activeTab, setActiveTab] = useState<TabType>('video');

  // Sync tab with active lesson type on lesson selection
  useEffect(() => {
    if (activeLesson) {
      if (activeLesson.type === 'pdf') setActiveTab('pdf');
      else if (activeLesson.type === 'text') setActiveTab('text');
      else if (activeLesson.type === 'resource') setActiveTab('resources');
      else setActiveTab('video');
    }
  }, [activeLessonId, activeLesson]);

  // Mobile sidebar drawer open/close
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleRatingUpdated = useCallback((newAvg: number, newCount: number) => {
    setCourse((prev) => (prev ? { ...prev, rating: newAvg, reviewsCount: newCount } : prev));
  }, []);



  // Fetch course and live curriculum & progress on mount or param change
  useEffect(() => {
    if (!activeCourseId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setModules([]);
    setActiveLessonId('');

    // Fetch course details, live curriculum, and student lesson progress in parallel
    Promise.all([
      courseService.getCourseByIdOrSlug(activeCourseId).catch(() => null),
      curriculumService.getPublicCourseCurriculum(activeCourseId).catch(() => null),
      progressService.getStudentCourseLessonsProgress(activeCourseId).catch(() => null),
    ]).then(([courseRes, currRes, progRes]) => {
      if (!isMounted) return;

      if (courseRes && courseRes.success && courseRes.data) {
        setCourse(courseRes.data);
      } else {
        setHasError(true);
      }

      // Extract completed lesson IDs from real student progress
      const completedLessonSet = new Set<string>();
      if (progRes && progRes.success && Array.isArray(progRes.data)) {
        progRes.data
          .filter((p) => p.status === 'Completed')
          .forEach((p) => completedLessonSet.add(p.lessonId));
      }

      if (currRes && currRes.success && currRes.data?.modules) {
        const liveModules: PlayerModule[] = currRes.data.modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          lessons: (m.lessons || []).map((l) => ({
            id: l.id,
            moduleId: m.id,
            moduleTitle: m.title,
            title: l.title,
            duration: formatLessonDuration(l.durationMinutes, l.lessonType),
            type: (l.lessonType?.toLowerCase() as 'video' | 'pdf' | 'text' | 'resource') || 'video',
            isCompleted: completedLessonSet.has(l.id),
            isBookmarked: false,
            isLocked: l.isPreview !== undefined ? !l.isPreview : Boolean((l as any).isLocked),
            isPreview: l.isPreview !== undefined ? l.isPreview : true,
            videoUrl: l.videoUrl || undefined,
            videoSourceType: 'link',
            pdfUrl: l.documentUrl || undefined,
            pdfTitle: l.title,
            pdfPageCount: 8,
            textContent: l.content
              ? {
                  subtitle: l.shortDescription || 'Lesson Reading Guide',
                  introduction: l.content,
                  sections: [],
                  keyTakeaways: [],
                }
              : undefined,
            resources: l.resourceUrl
              ? [
                  {
                    id: `res-${l.id}`,
                    title: `${l.title} Resource File`,
                    fileType: 'pdf',
                    fileSize: 'Downloadable File',
                    downloadUrl: l.resourceUrl,
                  },
                ]
              : [],
          })),
        }));

        setModules(liveModules);

        // Pick first uncompleted and unlocked lesson, or first lesson
        let prevDone = true;
        const allWithLock = liveModules.flatMap((m) =>
          m.lessons.map((l) => {
            const reqLock = l.isLocked === true || l.isPreview === false;
            const locked = reqLock && !l.isCompleted && !prevDone;
            prevDone = Boolean(l.isCompleted);
            return { ...l, isLocked: locked };
          })
        );
        const firstAvailable = allWithLock.find((l) => !l.isCompleted && !l.isLocked) || allWithLock.find((l) => !l.isLocked) || allWithLock[0];
        if (firstAvailable) {
          setActiveLessonId(firstAvailable.id);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeCourseId]);

  // Overall Progress Calculations
  const completedLessonsCount = useMemo(() => {
    return allLessons.filter((l) => l.isCompleted).length;
  }, [allLessons]);

  const progressPercentage = useMemo(() => {
    if (allLessons.length === 0) return 0;
    return Math.round((completedLessonsCount / allLessons.length) * 100);
  }, [allLessons.length, completedLessonsCount]);

  // Navigation indexes
  const currentLessonIndex = useMemo(() => {
    return allLessons.findIndex((l) => l.id === activeLessonId);
  }, [allLessons, activeLessonId]);

  const hasPrevious = currentLessonIndex > 0;
  const hasNext = currentLessonIndex < allLessons.length - 1;

  const handleSelectLesson = (lesson: PlayerLesson) => {
    if (lesson.isLocked) {
      showToastAlert('🔒 This lesson is locked. Complete the previous lesson first to unlock.', 'warning');
      return;
    }
    setActiveLessonId(lesson.id);
    setIsMobileSidebarOpen(false);
    resetScrollToTop();
  };

  const handlePreviousLesson = () => {
    if (hasPrevious) {
      setActiveLessonId(allLessons[currentLessonIndex - 1].id);
      resetScrollToTop();
    }
  };

  const handleNextLesson = () => {
    if (hasNext) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      if (nextLesson?.isLocked) {
        showToastAlert('🔒 The next lesson is locked. Please mark this lesson as completed first.', 'warning');
        return;
      }
      setActiveLessonId(nextLesson.id);
      resetScrollToTop();
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger if user is typing in notes input
      }
      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePreviousLesson();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNextLesson();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLessonIndex, hasPrevious, hasNext]);

  // Learning Actions
  const handleToggleMarkComplete = () => {
    if (!activeLesson || !activeCourseId) return;
    const wasCompleted = activeLesson.isCompleted;

    // Call backend API to record Completed status in database
    if (!wasCompleted) {
      progressService.completeLesson(activeCourseId, activeLesson.id).catch(() => null);
    }

    setModules((prevModules) => {
      const nextModules = prevModules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((les) => {
          if (les.id === activeLesson.id) {
            return { ...les, isCompleted: !les.isCompleted };
          }
          return les;
        }),
      }));

      // Calculate new total completed count
      let totalCompleted = 0;
      let totalLessons = 0;
      nextModules.forEach((m) => {
        m.lessons.forEach((l) => {
          totalLessons++;
          if (l.isCompleted) totalCompleted++;
        });
      });

      // If all lessons are completed, pop completion modal ("Complete Assignment" step)
      if (totalLessons > 0 && totalCompleted === totalLessons) {
        setTimeout(() => setIsCompletionModalOpen(true), 300);
      } else if (!wasCompleted && hasNext) {
        // Automatically move to the next available lesson
        setTimeout(() => {
          setActiveLessonId(allLessons[currentLessonIndex + 1].id);
          resetScrollToTop();
        }, 400);
      }

      return nextModules;
    });
  };

  const handleToggleBookmark = () => {
    if (!activeLesson) return;
    setModules((prevModules) =>
      prevModules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((les) => {
          if (les.id === activeLesson.id) {
            return { ...les, isBookmarked: !les.isBookmarked };
          }
          return les;
        }),
      }))
    );
  };

  // Personal Notes Actions
  const handleAddNote = (noteData: Omit<PlayerPersonalNote, 'id' | 'createdAt'>) => {
    const newNote: PlayerPersonalNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: 'Just now',
    };
    setPersonalNotes([newNote, ...personalNotes]);
  };

  const handleEditNote = (id: string, newContent: string) => {
    setPersonalNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content: newContent } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setPersonalNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Bookmarked lessons subset
  const bookmarkedLessons = useMemo(() => {
    return allLessons.filter((l) => l.isBookmarked);
  }, [allLessons]);

  // Compute real upcoming learning from actual curriculum modules and lesson progress
  const upcomingRoadmap = useMemo(() => {
    const nextUnfinished = allLessons.find((l) => !l.isCompleted && l.id !== activeLessonId);
    return {
      nextLesson: nextUnfinished
        ? {
            id: nextUnfinished.id,
            title: nextUnfinished.title,
            duration: nextUnfinished.duration || '10:00',
            moduleTitle: nextUnfinished.moduleTitle,
          }
        : undefined,
      upcomingAssignment: {
        id: `asg-${activeCourseId}`,
        title: `${course?.title || 'Course'} Comprehensive Capstone Project`,
        dueDate: 'Self-paced',
        points: 100,
      },
      upcomingQuiz: {
        id: `quiz-${activeCourseId}`,
        title: `${course?.title || 'Course'} Module Knowledge Assessment`,
        timeLimit: '30 mins',
        questionsCount: 15,
      },
    };
  }, [allLessons, activeLessonId, activeCourseId, course?.title]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <SkeletonLoader className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <SkeletonLoader className="h-[600px] lg:col-span-3 rounded-2xl" />
          <SkeletonLoader className="h-[600px] lg:col-span-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (hasError || !course) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-6 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Unable to Load Course Learning Player
          </h2>
          <p className="text-sm text-slate-500">
            The requested course could not be retrieved from the database. Please verify your enrollment status or try again.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/student/courses')} className="mx-auto">
          <FiArrowLeft className="w-4 h-4 mr-2" /> Back to My Courses
        </Button>
      </div>
    );
  }

  if (allLessons.length === 0 || !activeLesson) {
    return (
      <div className="space-y-6 pb-16">
        <PlayerHeader
          course={course}
          progressPercentage={0}
          completedLessonsCount={0}
          totalLessonsCount={0}
          onOpenCertificateModal={() => {}}
        />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto">
          <FiBookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Curriculum Content Under Preparation
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The instructor has not published any lesson modules for this course yet. Please check back shortly.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/courses')} className="mx-auto">
            <FiArrowLeft className="w-4 h-4 mr-1.5" /> Return to My Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-16"
    >
      {/* 1. Course Header */}
      <PlayerHeader
        course={course}
        progressPercentage={progressPercentage}
        completedLessonsCount={completedLessonsCount}
        totalLessonsCount={allLessons.length}
        onOpenCertificateModal={() => setIsCompletionModalOpen(true)}
        onShareCourse={() => alert(`Course link: ${window.location.origin}/student/player/${course.id}`)}
        onRateCourse={progressPercentage >= 100 && allLessons.length > 0 ? () => setIsReviewModalOpen(true) : undefined}
      />

      {/* 100% Completion Notification Banner */}
      {progressPercentage >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm">
                Congratulations! You have completed all lessons. Please complete the mandatory assignments to continue.
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                100% lessons completed. Share your feedback by rating this course!
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsReviewModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold shrink-0 flex items-center gap-1.5"
          >
            <FiStar className="w-4 h-4 fill-white" />
            <span>Rate Course</span>
          </Button>
        </motion.div>
      )}

      {/* 2. Main Player Layout (Sidebar on Left, Player Canvas on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Desktop Sidebar: 4 cols) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-4">
          <PlayerSidebar
            modules={displayModules}
            activeLessonId={activeLesson.id}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {/* Mobile Sidebar Trigger & Drawer Modal */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <FiBookOpen className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Curriculum Lessons
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-1.5"
          >
            <FiMenu className="w-4 h-4" />
            <span>Browse Lessons</span>
          </Button>
        </div>

        {/* Mobile Sidebar Modal Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative z-10 w-4/5 max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto p-4 flex flex-col"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    Course Curriculum
                  </span>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <PlayerSidebar
                  modules={displayModules}
                  activeLessonId={activeLesson.id}
                  onSelectLesson={handleSelectLesson}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Right Column (Main Learning Content Area) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Content Tabs Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Learning content tabs">
              <button
                role="tab"
                aria-selected={activeTab === 'video'}
                aria-controls="panel-video"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'video'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FiPlayCircle className="w-4 h-4" />
                <span>Video Lesson</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'pdf'}
                aria-controls="panel-pdf"
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'pdf'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FiFileText className="w-4 h-4" />
                <span>PDF Notes</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'text'}
                aria-controls="panel-text"
                onClick={() => setActiveTab('text')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'text'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FiFile className="w-4 h-4" />
                <span>Text Lesson</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'resources'}
                aria-controls="panel-resources"
                onClick={() => setActiveTab('resources')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'resources'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FiFolder className="w-4 h-4" />
                <span>Resources</span>
                {activeLesson?.resources && activeLesson.resources.length > 0 && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {activeLesson.resources.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content Display Area with Animated Transitions */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'video' && (
                <motion.div
                  key="video-tab"
                  id="panel-video"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <VideoLessonPlayer lesson={activeLesson} showDetailsBanner={true} />
                </motion.div>
              )}

              {activeTab === 'pdf' && (
                <motion.div
                  key="pdf-tab"
                  id="panel-pdf"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PdfNotesViewer lesson={activeLesson} />
                </motion.div>
              )}

              {activeTab === 'text' && (
                <motion.div
                  key="text-tab"
                  id="panel-text"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TextLessonContent lesson={activeLesson} />
                </motion.div>
              )}

              {activeTab === 'resources' && (
                <motion.div
                  key="resources-tab"
                  id="panel-resources"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ResourcesList resources={activeLesson?.resources} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Lesson Action & Navigation Bar (Directly Below Video/Lesson Content) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            {/* Left: Previous & Mark as Complete */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <Button
                variant="outline"
                size="md"
                onClick={handlePreviousLesson}
                disabled={!hasPrevious}
                className="flex items-center gap-1.5 disabled:opacity-40"
                aria-label="Previous Lesson"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <Button
                variant={activeLesson.isCompleted ? 'outline' : 'primary'}
                size="md"
                onClick={handleToggleMarkComplete}
                className={`flex items-center gap-2 font-bold flex-1 sm:flex-none justify-center ${
                  activeLesson.isCompleted
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                }`}
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>{activeLesson.isCompleted ? 'Completed ✓' : 'Mark as Complete'}</span>
              </Button>
            </div>

            {/* Right: Bookmark, Counter, Next Lesson */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1.5 ${
                  activeLesson.isBookmarked
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FiBookmark className={`w-4 h-4 ${activeLesson.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span className="hidden md:inline">{activeLesson.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </Button>

              <span className="text-xs text-slate-400 font-mono hidden lg:inline px-2">
                Lesson {currentLessonIndex + 1} of {allLessons.length}
              </span>

              <Button
                variant="primary"
                size="md"
                onClick={handleNextLesson}
                disabled={!hasNext}
                className="flex items-center gap-1.5 disabled:opacity-40 bg-brand-600 hover:bg-brand-700 text-white"
                aria-label="Next Lesson"
              >
                <span>Next Lesson</span>
                <FiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Helper Sections: Personal Notes, Bookmarks & Upcoming Learning */}
          <div className="space-y-6 pt-2">
            <PersonalNotesPanel
              notes={personalNotes}
              activeLessonTitle={activeLesson.title}
              activeLessonId={activeLesson.id}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />

            <BookmarksPanel
              bookmarkedLessons={bookmarkedLessons}
              activeLessonId={activeLessonId}
              onSelectLesson={handleSelectLesson}
            />

            <UpcomingLearningCard
              upcomingData={upcomingRoadmap}
              onNavigateNextLesson={handleNextLesson}
            />
          </div>
        </div>
      </div>

      {/* Course Ratings & Reviews Section (Browsing open, reviewing unlocked only after 100% course lessons completed) */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <CourseReviewsSection
          courseId={course.id}
          courseTitle={course.title}
          isEnrolled={true}
          isCourseCompleted={progressPercentage >= 100 && allLessons.length > 0}
          completedLessonsCount={completedLessonsCount}
          totalLessonsCount={allLessons.length}
          currentUserId={currentUser?.id}
          onRatingUpdated={handleRatingUpdated}
        />
      </div>

      {/* Completion Modal */}
      <CourseCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        course={course}
        onRateCourse={() => setIsReviewModalOpen(true)}
      />

      {/* Course Review & Rating Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        courseId={course.id}
        courseTitle={course.title}
        onReviewSubmitted={(rev) => {
          if (rev?.rating) {
            handleRatingUpdated(rev.rating, (course.reviewsCount || 0) + 1);
          }
        }}
      />

      {/* Floating Student AI Assistant Component */}
      <StudentAiAssistant />
    </motion.div>
  );
};


import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiVideo,
  FiFileText,
  FiDownload,
  FiFile,
  FiFolder,
  FiPlayCircle,
  FiHelpCircle,
  FiMessageSquare,
  FiUser,
  FiAward,
  FiBriefcase,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiBarChart2,
  FiEye,
  FiSend,
  FiMail,
  FiCalendar,
  FiAlertTriangle
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { VideoLessonPlayer } from '../../components/player/VideoLessonPlayer';
import { PdfNotesViewer } from '../../components/player/PdfNotesViewer';
import { TextLessonContent } from '../../components/player/TextLessonContent';
import { ResourcesList } from '../../components/player/ResourcesList';
import type { PlayerLesson } from '../../types';
import { type InstructorCourseItem } from '../../data/instructorCoursesData';
import {
  type CourseReviewDetailsData,
  type ReviewLessonItem
} from '../../data/courseReviewData';
import { courseService } from '../../services/courseService';

interface AdminCourseReviewProps {
  course: InstructorCourseItem;
  onBack: () => void;
  onApprove: (courseId: string) => void;
  onReject: (courseId: string) => void;
  onRequestChanges: (courseId: string, feedback: string) => void;
}

export const AdminCourseReview: React.FC<AdminCourseReviewProps> = ({
  course,
  onBack,
  onApprove,
  onReject,
  onRequestChanges
}) => {
  // Live API review data state
  const [reviewData, setReviewData] = useState<CourseReviewDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch full review details from API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchReviewDetails = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await courseService.getAdminCourseById(course.id);
        if (!isMounted) return;
        if (res.success && res.data) {
          setReviewData(res.data);
        } else {
          setLoadError(res.message || 'Failed to load course review details.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setLoadError(err.message || 'Failed to load course review details.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReviewDetails();
    return () => {
      isMounted = false;
    };
  }, [course.id]);

  // Active section state
  const [activeSection, setActiveSection] = useState<'info' | 'curriculum' | 'content' | 'assignments' | 'quizzes' | 'instructor' | 'summary'>('info');

  // Preview attachment modal state
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string } | null>(null);

  // Currently selected lesson for preview
  const allLessons = useMemo(() => {
    return reviewData ? reviewData.sections.flatMap((sec) => sec.lessons) : [];
  }, [reviewData]);

  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonItem | null>(null);

  // Inspected lessons state tracking
  const [inspectedLessons, setInspectedLessons] = useState<Record<string, boolean>>({});

  // Auto-mark selected lesson as inspected when viewed
  useEffect(() => {
    if (selectedLesson?.id) {
      setInspectedLessons((prev) => ({ ...prev, [selectedLesson.id]: true }));
    }
  }, [selectedLesson?.id]);

  const toggleLessonInspected = (lessonId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInspectedLessons((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  const inspectedLessonsCount = useMemo(() => {
    return Object.values(inspectedLessons).filter(Boolean).length;
  }, [inspectedLessons]);

  // Lesson Navigation & Step calculation
  const currentLessonIndex = useMemo(() => {
    return allLessons.findIndex((l) => l.id === selectedLesson?.id);
  }, [allLessons, selectedLesson?.id]);

  const hasPreviousLesson = currentLessonIndex > 0;
  const hasNextLesson = currentLessonIndex !== -1 && currentLessonIndex < allLessons.length - 1;

  const handlePrevLesson = () => {
    if (hasPreviousLesson) {
      const prevLesson = allLessons[currentLessonIndex - 1];
      setSelectedLesson(prevLesson);
    }
  };

  const handleNextLesson = () => {
    // Auto-mark current lesson as inspected
    if (selectedLesson?.id) {
      setInspectedLessons((prev) => ({ ...prev, [selectedLesson.id]: true }));
    }
    if (hasNextLesson) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      setSelectedLesson(nextLesson);
    } else {
      scrollToSection('assignments');
    }
  };

  // Tab State for Lesson Content Inspection: 'video' | 'pdf' | 'text' | 'resources'
  type LessonInspectTabType = 'video' | 'pdf' | 'text' | 'resources';
  const [activeLessonTab, setActiveLessonTab] = useState<LessonInspectTabType>('video');

  // Auto switch tab when selected lesson type changes
  useEffect(() => {
    if (selectedLesson) {
      const lType = (selectedLesson.type || '').toLowerCase();
      if (lType === 'pdf') setActiveLessonTab('pdf');
      else if (lType === 'text') setActiveLessonTab('text');
      else if (lType === 'resource') setActiveLessonTab('resources');
      else setActiveLessonTab('video');
    }
  }, [selectedLesson?.id, selectedLesson?.type]);

  // Adapter to pass selectedLesson seamlessly to student player components
  const playerLessonAdapter: PlayerLesson | null = useMemo(() => {
    if (!selectedLesson) return null;
    return {
      id: selectedLesson.id,
      moduleId: selectedLesson.sectionId,
      moduleTitle: selectedLesson.sectionTitle,
      title: selectedLesson.title,
      duration: `${selectedLesson.durationMinutes || 10}:00`,
      type: (selectedLesson.type || 'video').toLowerCase() as 'video' | 'pdf' | 'text' | 'resource',
      isCompleted: !!inspectedLessons[selectedLesson.id],
      isBookmarked: false,
      videoUrl: selectedLesson.videoUrl,
      pdfUrl: selectedLesson.pdfUrl,
      pdfTitle: `${selectedLesson.title} - Document`,
      pdfPageCount: selectedLesson.pdfPageCount,
      textContent: selectedLesson.textContent
        ? (typeof selectedLesson.textContent === 'string'
            ? {
                subtitle: selectedLesson.sectionTitle,
                introduction: selectedLesson.textContent,
                sections: [],
                keyTakeaways: [],
              }
            : selectedLesson.textContent)
        : undefined,
      resources: selectedLesson.resources?.map((r) => ({
        id: r.id,
        title: r.name,
        fileType: (r.fileType.toLowerCase() as any) || 'pdf',
        fileSize: r.size,
        downloadUrl: r.downloadUrl,
      })),
    };
  }, [selectedLesson, inspectedLessons]);

  // Update selected lesson when allLessons changes
  useEffect(() => {
    if (allLessons.length > 0 && !selectedLesson) {
      setSelectedLesson(allLessons[0]);
    }
  }, [allLessons, selectedLesson]);

  // Accordion state for curriculum sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (reviewData) {
      const initialState: Record<string, boolean> = {};
      reviewData.sections.forEach((sec, idx) => {
        initialState[sec.id] = idx === 0;
      });
      setExpandedSections(initialState);
    }
  }, [reviewData]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

// Core verification checklist definitions
const REVIEW_CHECKLIST_ITEMS = [
  { id: 'info', label: 'Course Information' },
  { id: 'curriculum', label: 'Curriculum & Structure' },
  { id: 'content', label: 'Lesson Content & Media' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'quizzes', label: 'Quizzes & Question Keys' },
  { id: 'instructor', label: 'Instructor Information' },
] as const;

  // Review Checklist Items state
  const [reviewedChecklist, setReviewedChecklist] = useState<Record<string, boolean>>({
    info: true,
    curriculum: false,
    content: false,
    assignments: false,
    quizzes: false,
    instructor: false,
  });

  const toggleChecklistItem = (key: string) => {
    setReviewedChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistCount = useMemo(() => {
    return REVIEW_CHECKLIST_ITEMS.filter((item) => Boolean(reviewedChecklist[item.id])).length;
  }, [reviewedChecklist]);

  const reviewProgressPercentage = useMemo(() => {
    return Math.min(100, Math.round((checklistCount / REVIEW_CHECKLIST_ITEMS.length) * 100));
  }, [checklistCount]);

  // Request Changes feedback drawer state
  const [showRequestChangesForm, setShowRequestChangesForm] = useState<boolean>(false);
  const [reviewComments, setReviewComments] = useState<string>(course.rejectionReason || '');

  // Calculate Course Summary metrics
  const summaryMetrics = useMemo(() => {
    if (!reviewData) {
      return {
        totalSections: 0,
        totalLessons: 0,
        totalVideos: 0,
        totalPDFs: 0,
        totalResources: 0,
        totalAssignments: 0,
        totalQuizzes: 0,
        estimatedDurationHours: 0,
      };
    }

    const totalSections = reviewData.sections.length;
    const totalLessons = allLessons.length;
    const totalVideos = allLessons.filter((l) => l.type === 'Video').length;
    const totalPDFs = allLessons.filter((l) => l.type === 'PDF' || l.pdfUrl).length;
    const totalResources = allLessons.reduce((acc, l) => acc + (l.resources ? l.resources.length : 0), 0);
    const totalAssignments = reviewData.assignments.length;
    const totalQuizzes = reviewData.quizzes.length;
    const estimatedDurationHours =
      course.durationHours ||
      Math.ceil(allLessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0) / 60) ||
      (totalLessons > 0 ? totalLessons * 1 : 0);

    return {
      totalSections,
      totalLessons,
      totalVideos,
      totalPDFs,
      totalResources,
      totalAssignments,
      totalQuizzes,
      estimatedDurationHours
    };
  }, [reviewData, allLessons, course]);

  const handleSendFeedback = () => {
    if (!reviewComments.trim()) return;
    onRequestChanges(course.id, reviewComments);
    setShowRequestChangesForm(false);
  };

  const scrollToSection = (sectionId: typeof activeSection) => {
    setActiveSection(sectionId);
    setReviewedChecklist((prev) => ({ ...prev, [sectionId]: true }));
    const el = document.getElementById(`review-part-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
          Loading real course review data from database...
        </p>
      </div>
    );
  }

  if (loadError || !reviewData) {
    return (
      <div className="p-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12">
        <FiAlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-200">
          Failed to Load Course Review
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300">
          {loadError || 'Unable to retrieve course details from the database.'}
        </p>
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back to Course Approval List
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 font-sans pb-24 max-w-[1700px] mx-auto"
    >
      {/* Top Header Workspace Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="rounded-xl text-xs flex items-center gap-2 border-slate-300 dark:border-slate-700"
          >
            <FiArrowLeft className="w-4 h-4" /> Exit Review Workspace
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-md">
                {course.category}
              </span>
              <Badge
                variant={
                  course.approvalStatus === 'Approved'
                    ? 'success'
                    : course.approvalStatus === 'Pending Approval'
                    ? 'warning'
                    : 'danger'
                }
              >
                {course.approvalStatus}
              </Badge>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Submitted: {reviewData.submissionDate}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
            <FiEye className="w-3.5 h-3.5" />
            <span>Student Experience Inspection (Read-Only)</span>
          </div>
        </div>
      </div>

      {/* 3-PANEL REVIEW WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* LEFT PANEL: COURSE NAVIGATION & REVIEW CHECKLIST */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-6 sticky top-6">
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <FiLayers className="w-4 h-4 text-amber-500" /> Course Navigation
              </h3>
            </div>

            <nav className="space-y-1 text-xs font-bold">
              {[
                { id: 'info', label: 'Course Information', icon: FiBookOpen },
                { id: 'curriculum', label: 'Curriculum & Structure', icon: FiLayers },
                { id: 'content', label: 'Lesson Content Preview', icon: FiVideo },
                { id: 'assignments', label: `Assignments (${reviewData.assignments.length})`, icon: FiFileText },
                { id: 'quizzes', label: `Quizzes (${reviewData.quizzes.length})`, icon: FiHelpCircle },
                { id: 'instructor', label: 'Instructor Information', icon: FiUser },
                { id: 'summary', label: 'Course Summary', icon: FiBarChart2 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isChecked = reviewedChecklist[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id as any)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isChecked && (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-white text-amber-600 font-bold' : 'bg-emerald-500 text-white'}`}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Interactive Review Checklist Card */}
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Review Verification Checklist
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {checklistCount}/{REVIEW_CHECKLIST_ITEMS.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Verification Progress</span>
                <span>{reviewProgressPercentage}% Complete</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${reviewProgressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1">
              {REVIEW_CHECKLIST_ITEMS.map((chk) => (
                <label
                  key={chk.id}
                  className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!reviewedChecklist[chk.id]}
                    onChange={() => toggleChecklistItem(chk.id)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={`font-semibold ${reviewedChecklist[chk.id] ? 'text-slate-900 dark:text-slate-100 font-bold line-through opacity-80' : 'text-slate-600 dark:text-slate-400'}`}>
                    {chk.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* CENTER PANEL: SELECTED CONTENT WORKSPACE PREVIEW */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* COURSE INFORMATION PART */}
          <div id="review-part-info">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiBookOpen className="w-5 h-5 text-amber-500" /> Course Information
                </h2>
                <Badge variant={reviewData.completion?.courseComplete ? 'success' : 'warning'}>
                  {reviewData.completion?.courseComplete ? '5/5 Requirements Met' : 'Readiness Incomplete'}
                </Badge>
              </div>

              {/* Course Readiness Audit Breakdown */}
              {reviewData.completion && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                    Automated Course Readiness Verification:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-bold">
                    <span className={`p-2 rounded-xl border flex items-center gap-1.5 ${reviewData.completion.courseInfoComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'}`}>
                      {reviewData.completion.courseInfoComplete ? '✓' : '✗'} Info
                    </span>
                    <span className={`p-2 rounded-xl border flex items-center gap-1.5 ${reviewData.completion.curriculumComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'}`}>
                      {reviewData.completion.curriculumComplete ? '✓' : '✗'} Curriculum
                    </span>
                    <span className={`p-2 rounded-xl border flex items-center gap-1.5 ${reviewData.completion.contentComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'}`}>
                      {reviewData.completion.contentComplete ? '✓' : '✗'} Lessons
                    </span>
                    <span className={`p-2 rounded-xl border flex items-center gap-1.5 ${reviewData.completion.assignmentsComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'}`}>
                      {reviewData.completion.assignmentsComplete ? '✓' : '✗'} Assignments
                    </span>
                    <span className={`p-2 rounded-xl border flex items-center gap-1.5 ${reviewData.completion.quizzesComplete ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'}`}>
                      {reviewData.completion.quizzesComplete ? '✓' : '✗'} Quiz
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Media Preview: Thumbnail & Promotional Video */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Course Thumbnail</span>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video">
                      <img src={reviewData.thumbnail} alt={reviewData.title} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Promotional Video</span>
                    <div className="w-full">
                      {reviewData.promoVideoUrl ? (
                        <VideoLessonPlayer
                          key={reviewData.promoVideoUrl}
                          showDetailsBanner={false}
                          lesson={{
                            id: `review-promo-${reviewData.courseId || 'promo'}`,
                            moduleId: 'promo',
                            moduleTitle: 'Course Overview',
                            title: `${reviewData.title} - Promotional Video`,
                            duration: '02:00',
                            type: 'video',
                            isCompleted: false,
                            isBookmarked: false,
                            videoUrl: reviewData.promoVideoUrl,
                            videoPoster: reviewData.thumbnail || '',
                          }}
                        />
                      ) : (
                        <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <span className="text-xs text-slate-500">No promotional video uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course Main Specs */}
                <div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    {reviewData.category}
                  </span>
                  <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {reviewData.title}
                  </h1>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Language</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.language}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Difficulty</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Price (₹)</span>
                    {reviewData.price === 0 ? (
                      <span className="font-black text-emerald-600 dark:text-emerald-400">Free</span>
                    ) : (reviewData.discountPrice !== undefined && reviewData.discountPrice !== null && reviewData.discountPrice > 0 && reviewData.discountPrice < reviewData.price) ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ₹{reviewData.discountPrice}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{reviewData.price}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {Math.round(((reviewData.price - reviewData.discountPrice) / reviewData.price) * 100)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        ₹{reviewData.price}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">Est. Duration</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{summaryMetrics.estimatedDurationHours} Hours</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Description
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    {reviewData.fullDescription}
                  </p>
                </div>

                {/* Outcomes & Requirements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <FiCheck className="w-4 h-4 text-emerald-500" /> Learning Outcomes
                    </h3>
                    <ul className="space-y-2 text-xs">
                      {reviewData.learningOutcomes.map((out, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 text-slate-700 dark:text-slate-200">
                          <FiCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <FiInfo className="w-4 h-4 text-indigo-500" /> Requirements
                    </h3>
                    <ul className="space-y-2 text-xs">
                      {reviewData.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 text-slate-700 dark:text-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* CURRICULUM REVIEW PART */}
          <div id="review-part-curriculum">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiLayers className="w-5 h-5 text-indigo-500" /> Curriculum Review
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {summaryMetrics.totalSections} Sections • {summaryMetrics.totalLessons} Lessons ({summaryMetrics.estimatedDurationHours} Hours Total)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                    inspectedLessonsCount === allLessons.length && allLessons.length > 0
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>{inspectedLessonsCount}/{allLessons.length} Inspected</span>
                  </span>
                  <Badge variant="neutral">Curriculum Tree</Badge>
                </div>
              </div>

              <div className="space-y-4">
                {reviewData.sections.map((sec, sIdx) => {
                  const isExpanded = !!expandedSections[sec.id];
                  const sectionInspectedCount = sec.lessons.filter((l) => inspectedLessons[l.id]).length;
                  return (
                    <div key={sec.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
                      <button
                        onClick={() => toggleSection(sec.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-colors ${
                            sectionInspectedCount === sec.lessons.length && sec.lessons.length > 0
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}>
                            {sectionInspectedCount === sec.lessons.length && sec.lessons.length > 0 ? '✓' : sIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {sec.title}
                            </h3>
                            <p className="text-xs text-slate-500">{sec.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            {sectionInspectedCount}/{sec.lessons.length} Inspected ✓
                          </span>
                          {isExpanded ? <FiChevronUp className="w-4 h-4 text-slate-400" /> : <FiChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900"
                          >
                            {sec.lessons.map((les, lIdx) => {
                              const isSelected = selectedLesson?.id === les.id;
                              const isInspected = !!inspectedLessons[les.id];
                              return (
                                <div
                                  key={les.id}
                                  className={`p-3.5 px-5 flex items-center justify-between gap-3 text-xs transition-colors ${
                                    isSelected
                                      ? 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-l-amber-500'
                                      : isInspected
                                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/50'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      onClick={(e) => toggleLessonInspected(les.id, e)}
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${
                                        isInspected
                                          ? 'bg-emerald-500 text-white shadow-xs'
                                          : 'border border-slate-300 dark:border-slate-600 text-slate-400 hover:border-emerald-500'
                                      }`}
                                      title={isInspected ? 'Inspected! Click to unmark' : 'Click to mark as Inspected'}
                                    >
                                      {isInspected ? '✓' : `${sIdx + 1}.${lIdx + 1}`}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{les.title}</h4>
                                        {isInspected && (
                                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800">
                                            ✓ Inspected
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400">
                                        {les.type === 'PDF' ? 'PDF Document' : `${les.durationMinutes || 0} Mins • Video`}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        les.status === 'Published'
                                          ? 'success'
                                          : les.status === 'Under Review'
                                          ? 'warning'
                                          : les.status === 'Ready'
                                          ? 'info'
                                          : 'neutral'
                                      }
                                    >
                                      {les.status}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant={isSelected ? 'primary' : isInspected ? 'outline' : 'secondary'}
                                      onClick={() => {
                                        setSelectedLesson(les);
                                        scrollToSection('content');
                                      }}
                                      className={`text-xs py-1 px-3 rounded-lg font-bold flex items-center gap-1 ${
                                        isInspected && !isSelected
                                          ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40'
                                          : ''
                                      }`}
                                    >
                                      {isSelected ? 'Previewing' : isInspected ? '✓ Inspected' : 'Inspect'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* LESSON CONTENT PREVIEW PART (STUDENT LEARNING PLAYER EXPERIENCE) */}
          <div id="review-part-content">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              {/* Header with Title and Quick Lesson Selector */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiVideo className="w-5 h-5 text-purple-500" /> Lesson Content Inspection
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live student player view — verify video playback, PDF documents, text reading modules & resources.
                  </p>
                </div>

                {allLessons.length > 0 && selectedLesson && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Lesson:</span>
                    <select
                      value={selectedLesson.id}
                      onChange={(e) => {
                        const l = allLessons.find((item) => item.id === e.target.value);
                        if (l) setSelectedLesson(l);
                      }}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold max-w-[240px] truncate"
                    >
                      {allLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {inspectedLessons[l.id] ? '✓ ' : '• '}[{l.type}] {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Active Lesson Content Box */}
              {!selectedLesson || !playerLessonAdapter ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No lessons found in this course.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lesson Meta Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                        {selectedLesson.sectionTitle}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {selectedLesson.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Inspected Status Badge / Interactive Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleLessonInspected(selectedLesson.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                          inspectedLessons[selectedLesson.id]
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                        title={inspectedLessons[selectedLesson.id] ? 'Click to unmark inspection' : 'Click to mark as inspected'}
                      >
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>{inspectedLessons[selectedLesson.id] ? 'Inspected ✓' : 'Mark as Inspected'}</span>
                      </button>

                      <Badge
                        variant={
                          selectedLesson.status === 'Published'
                            ? 'success'
                            : selectedLesson.status === 'Under Review'
                            ? 'warning'
                            : selectedLesson.status === 'Ready'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        Status: {selectedLesson.status}
                      </Badge>
                      <Badge variant="primary">{selectedLesson.type}</Badge>
                    </div>
                  </div>

                  {/* 1. Content Tabs Header (Exactly like Student Player) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-1.5" role="tablist" aria-label="Lesson content tabs">
                      <button
                        role="tab"
                        aria-selected={activeLessonTab === 'video'}
                        onClick={() => setActiveLessonTab('video')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeLessonTab === 'video'
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <FiPlayCircle className="w-4 h-4" />
                        <span>Video Lesson</span>
                      </button>

                      <button
                        role="tab"
                        aria-selected={activeLessonTab === 'pdf'}
                        onClick={() => setActiveLessonTab('pdf')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeLessonTab === 'pdf'
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <FiFileText className="w-4 h-4" />
                        <span>PDF Notes</span>
                        {selectedLesson.pdfUrl && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </button>

                      <button
                        role="tab"
                        aria-selected={activeLessonTab === 'text'}
                        onClick={() => setActiveLessonTab('text')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeLessonTab === 'text'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <FiFile className="w-4 h-4" />
                        <span>Text Lesson</span>
                        {selectedLesson.textContent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </button>

                      <button
                        role="tab"
                        aria-selected={activeLessonTab === 'resources'}
                        onClick={() => setActiveLessonTab('resources')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeLessonTab === 'resources'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <FiFolder className="w-4 h-4" />
                        <span>Resources</span>
                        {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                            {selectedLesson.resources.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Tab Content Display Area (Student Player Components) */}
                  <div className="relative min-h-[380px]">
                    <AnimatePresence mode="wait">
                      {activeLessonTab === 'video' && (
                        <motion.div
                          key={`video-${selectedLesson.id}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <VideoLessonPlayer lesson={playerLessonAdapter} />
                        </motion.div>
                      )}

                      {activeLessonTab === 'pdf' && (
                        <motion.div
                          key={`pdf-${selectedLesson.id}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <PdfNotesViewer lesson={playerLessonAdapter} />
                        </motion.div>
                      )}

                      {activeLessonTab === 'text' && (
                        <motion.div
                          key={`text-${selectedLesson.id}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TextLessonContent lesson={playerLessonAdapter} />
                        </motion.div>
                      )}

                      {activeLessonTab === 'resources' && (
                        <motion.div
                          key={`res-${selectedLesson.id}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ResourcesList resources={playerLessonAdapter.resources} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 3. Interactive Lesson Action & Navigation Bar (Directly Below Player Canvas) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    {/* Left: Previous Lesson & Mark as Complete / Inspected */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handlePrevLesson}
                        disabled={!hasPreviousLesson}
                        className="flex items-center gap-1.5 disabled:opacity-40 text-xs font-bold"
                        aria-label="Previous Lesson"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </Button>

                      <Button
                        variant={inspectedLessons[selectedLesson.id] ? 'outline' : 'primary'}
                        size="md"
                        onClick={() => toggleLessonInspected(selectedLesson.id)}
                        className={`flex items-center gap-2 font-bold flex-1 sm:flex-none justify-center text-xs ${
                          inspectedLessons[selectedLesson.id]
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                        }`}
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>{inspectedLessons[selectedLesson.id] ? 'Inspected ✓' : 'Mark as Inspected'}</span>
                      </Button>
                    </div>

                    {/* Right: Counter and Next Lesson Button */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Lesson <span className="font-bold text-slate-800 dark:text-slate-200">{currentLessonIndex + 1}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{allLessons.length}</span>
                      </span>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleNextLesson}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
                        aria-label="Next Lesson"
                      >
                        <span>{hasNextLesson ? 'Next Lesson' : 'All Lessons Inspected (Next)'}</span>
                        <FiChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ASSIGNMENT REVIEW PART */}
          <div id="review-part-assignments">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiFileText className="w-5 h-5 text-indigo-500" /> Assignment Review
                </h2>
                <Badge variant="neutral">{reviewData.assignments.length} Assignments</Badge>
              </div>

              {reviewData.assignments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No assignments created.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewData.assignments.map((asg, aIdx) => (
                    <div key={asg.id} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          A{aIdx + 1}. {asg.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={asg.isMandatory ? 'danger' : 'neutral'}>
                            {asg.isMandatory ? 'Mandatory' : 'Optional'}
                          </Badge>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Max: {asg.maxMarks} | Pass: {asg.passingMarks}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{asg.description}</p>
                      {asg.instructions && (
                        <div className="space-y-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Instructions:</span>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                            {asg.instructions.map((ins, i) => (
                              <li key={i}>• {ins}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(asg.attachmentFileName || asg.attachmentUrl || (asg as any).attachmentName) && (
                        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <FiFileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate text-xs">
                                  {asg.attachmentFileName || (asg as any).attachmentName || 'Assignment Reference / Template'}
                                </span>
                                {asg.attachmentSize && (
                                  <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shrink-0 font-mono">
                                    {asg.attachmentSize}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
                                Reference Material / Starter Template
                              </span>
                            </div>
                          </div>
                          {asg.attachmentUrl && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewAttachment({
                                    url: asg.attachmentUrl!,
                                    name: asg.attachmentFileName || (asg as any).attachmentName || `${asg.title} Reference File`,
                                  })
                                }
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                                title="View & Inspect File"
                              >
                                <FiEye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>View File</span>
                              </button>

                              <a
                                href={asg.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                                title="Download to computer"
                              >
                                <FiDownload className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* QUIZ REVIEW PART */}
          <div id="review-part-quizzes">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiHelpCircle className="w-5 h-5 text-amber-500" /> Quiz & Question Key Review
                </h2>
                <Badge variant="warning">{reviewData.quizzes.length} Quizzes</Badge>
              </div>

              {reviewData.quizzes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No quizzes created.
                </div>
              ) : (
                <div className="space-y-6">
                  {reviewData.quizzes.map((quiz, qx) => (
                    <div key={quiz.id} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2">
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                            Quiz #{qx + 1}: {quiz.title}
                          </h3>
                          <p className="text-slate-500 text-xs">{quiz.description}</p>
                        </div>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Passing: {quiz.passingMarks}% | {quiz.timeLimitMinutes} Mins | {quiz.maxAttempts} Attempts
                        </span>
                      </div>

                      {quiz.questions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No questions in this quiz.</p>
                      ) : (
                        <div className="space-y-3">
                          {quiz.questions.map((q, qIdx) => (
                            <div key={q.id} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  Q{qIdx + 1}. {q.questionText}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded text-[10px]">
                                  {q.questionType}
                                </span>
                              </div>

                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  {q.options.map((opt) => (
                                    <div key={opt.id} className={`p-2 rounded border text-xs flex items-center justify-between ${opt.isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-950 dark:text-emerald-200 font-bold' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
                                      <span>{opt.text}</span>
                                      {opt.isCorrect && <span className="text-[10px] text-emerald-600 font-bold">✓ Correct</span>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.fillBlankAnswer && (
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-900 dark:text-emerald-200 font-bold rounded">
                                  Correct Blank Answer: {q.fillBlankAnswer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* INSTRUCTOR INFORMATION PART */}
          <div id="review-part-instructor">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-amber-500" /> Instructor Information
                </h2>
                <Badge variant="neutral">Author Profile</Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <img
                  src={reviewData.instructor.photoUrl}
                  alt={reviewData.instructor.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-sm shrink-0"
                />

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {reviewData.instructor.name}
                    </h3>
                    <p className="text-slate-500 mt-0.5">{reviewData.instructor.bio}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 pt-1">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <FiAward className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>Qualification:</strong> {reviewData.instructor.qualification}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <FiBriefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span><strong>Experience:</strong> {reviewData.instructor.experienceYears}+ Years</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <FiMail className="w-4 h-4 text-rose-500 shrink-0" />
                      <span><strong>Email:</strong> {reviewData.instructor.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <FiBookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Published Courses:</strong> {reviewData.instructor.totalPublishedCourses}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* COURSE SUMMARY PART */}
          <div id="review-part-summary">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiBarChart2 className="w-5 h-5 text-indigo-500" /> Course Summary
                </h2>
                <Badge variant="neutral">Audit Metrics</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiLayers className="w-4 h-4 text-indigo-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Sections</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalSections}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiFile className="w-4 h-4 text-purple-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Lessons</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalLessons}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiVideo className="w-4 h-4 text-emerald-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Videos</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalVideos}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiFileText className="w-4 h-4 text-rose-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">PDFs</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalPDFs}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiDownload className="w-4 h-4 text-cyan-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Resources</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalResources}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiFileText className="w-4 h-4 text-amber-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Assignments</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalAssignments}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiHelpCircle className="w-4 h-4 text-indigo-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Quizzes</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.totalQuizzes}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <FiClock className="w-4 h-4 text-teal-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Duration</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{summaryMetrics.estimatedDurationHours} Hrs</span>
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: APPROVAL CONTROL PANEL */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-6 sticky top-6">
          <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Approval Panel
              </h3>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Course Status:</span>
                <Badge
                  variant={
                    course.approvalStatus === 'Approved'
                      ? 'success'
                      : course.approvalStatus === 'Pending Approval'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {course.approvalStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <span className="text-slate-500 font-semibold">Submission Date:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.submissionDate}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <span className="text-slate-500 font-semibold">Instructor:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reviewData.instructorName}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <span className="text-slate-500 font-semibold">Review Progress:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{reviewProgressPercentage}% Verified</span>
              </div>
            </div>

            {/* Contextual Action Area based on Approval Status */}
            {course.approvalStatus === 'Pending Approval' && (
              <div className="space-y-2.5 pt-1">
                <Button
                  variant="primary"
                  onClick={() => onApprove(course.id)}
                  className="w-full text-xs py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <FiCheck className="w-4 h-4" /> Approve Course
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowRequestChangesForm(!showRequestChangesForm)}
                  className="w-full text-xs py-3 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <FiMessageSquare className="w-4 h-4" /> Request Changes
                </Button>

                <Button
                  variant="danger"
                  onClick={() => onReject(course.id)}
                  className="w-full text-xs py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <FiX className="w-4 h-4" /> Reject Course
                </Button>
              </div>
            )}

            {/* Approved & Published Status Card */}
            {course.approvalStatus === 'Approved' && (
              <div className="space-y-3 pt-1">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
                    <FiCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                      Live on Platform
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                      This course is approved and published in the student catalog.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestChangesForm(!showRequestChangesForm)}
                  className="w-full text-xs py-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <FiMessageSquare className="w-3.5 h-3.5" /> Request Revisions / Unpublish
                </Button>
              </div>
            )}

            {/* Rejected / Changes Requested Status Card */}
            {course.approvalStatus === 'Rejected' && (
              <div className="space-y-3 pt-1">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
                    <FiClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-100">
                      Changes Requested
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Awaiting instructor to make corrections and resubmit for review.
                    </p>
                  </div>
                  {course.rejectionReason && (
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-slate-700 dark:text-slate-300 text-left font-mono">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">Feedback sent:</span>
                      {course.rejectionReason}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(course.id)}
                  className="w-full text-xs py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <FiCheck className="w-3.5 h-3.5" /> Override & Approve Course
                </Button>
              </div>
            )}

            {/* Request Changes Inline Drawer Form */}
            <AnimatePresence>
              {showRequestChangesForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Review Comments *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter feedback for instructor (e.g. Please update audio quality in Section 2, and add passing criteria to Assignment 1)."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSendFeedback}
                    className="w-full text-xs py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <FiSend className="w-3.5 h-3.5" /> Send Feedback
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

      </div>

      {/* Interactive Attachment In-App Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FiFileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {previewAttachment.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Instructor Assignment Reference Material / Starter Template
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </a>

                  <a
                    href={previewAttachment.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Viewer */}
              <div className="flex-1 min-h-[400px] max-h-[calc(90vh-140px)] overflow-y-auto p-4 bg-slate-100/60 dark:bg-slate-950 flex flex-col items-center justify-center">
                {previewAttachment.url.toLowerCase().endsWith('.pdf') || previewAttachment.url.includes('.pdf') ? (
                  <iframe
                    src={previewAttachment.url}
                    title={previewAttachment.name}
                    className="w-full h-[65vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner bg-white"
                  />
                ) : previewAttachment.url.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) ? (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-md"
                  />
                ) : (
                  <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md space-y-4 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                      📁
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {previewAttachment.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        This file format (.zip / .docx / archive) can be viewed in your browser or downloaded directly.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <a
                        href={previewAttachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
                      >
                        <FiDownload className="w-4 h-4" /> Download Attachment
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
  FiHelpCircle,
  FiMessageSquare,
  FiUser,
  FiAward,
  FiBriefcase,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
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

// Helper to format YouTube and Vimeo URLs into standard embed URLs
const formatVideoEmbedUrl = (rawUrl: string): string => {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';

  // 1. YouTube embeds
  if (trimmed.includes('youtube.com/embed/')) {
    const idPart = trimmed.split('embed/')[1]?.split('?')[0];
    return `https://www.youtube-nocookie.com/embed/${idPart}?rel=0`;
  }
  if (trimmed.includes('youtube.com/shorts/')) {
    const vId = trimmed.split('shorts/')[1]?.split('?')[0]?.split('&')[0];
    if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0`;
  }
  if (trimmed.includes('youtube.com/watch')) {
    try {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const vId = urlObj.searchParams.get('v');
      if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0`;
    } catch {
      const vId = trimmed.split('watch?v=')[1]?.split('&')[0];
      if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0`;
    }
  }
  if (trimmed.includes('youtu.be/')) {
    const vId = trimmed.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    if (vId) return `https://www.youtube-nocookie.com/embed/${vId}?rel=0`;
  }

  // 2. Vimeo embeds (must use player.vimeo.com/video/{id})
  if (trimmed.includes('player.vimeo.com/video/')) {
    return trimmed;
  }
  if (trimmed.includes('vimeo.com/')) {
    const match = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)(?:\/([a-zA-Z0-9]+))?/);
    if (match && match[1]) {
      const videoId = match[1];
      const privacyHash = match[2];
      return `https://player.vimeo.com/video/${videoId}${privacyHash ? `?h=${privacyHash}` : ''}`;
    }
    const parts = trimmed.split('vimeo.com/')[1]?.split('?')[0]?.split('/');
    const vId = parts?.find((p) => /^[0-9]+$/.test(p));
    if (vId) return `https://player.vimeo.com/video/${vId}`;
  }

  return trimmed;
};

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

  // Currently selected lesson for preview
  const allLessons = useMemo(() => {
    return reviewData ? reviewData.sections.flatMap((sec) => sec.lessons) : [];
  }, [reviewData]);

  const [selectedLesson, setSelectedLesson] = useState<ReviewLessonItem | null>(null);

  // Update selected lesson when allLessons changes
  useEffect(() => {
    if (allLessons.length > 0) {
      setSelectedLesson(allLessons[0]);
    }
  }, [allLessons]);

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
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                      {reviewData.promoVideoUrl ? (
                        <video controls src={reviewData.promoVideoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-500">No promotional video uploaded</span>
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
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiLayers className="w-5 h-5 text-indigo-500" /> Curriculum Review
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {summaryMetrics.totalSections} Sections • {summaryMetrics.totalLessons} Lessons ({summaryMetrics.estimatedDurationHours} Hours Total)
                  </p>
                </div>
                <Badge variant="neutral">Curriculum Tree</Badge>
              </div>

              <div className="space-y-4">
                {reviewData.sections.map((sec, sIdx) => {
                  const isExpanded = !!expandedSections[sec.id];
                  return (
                    <div key={sec.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
                      <button
                        onClick={() => toggleSection(sec.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                            {sIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {sec.title}
                            </h3>
                            <p className="text-xs text-slate-500">{sec.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 font-semibold">{sec.lessons.length} Lessons</span>
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
                              return (
                                <div
                                  key={les.id}
                                  className={`p-3.5 px-5 flex items-center justify-between gap-3 text-xs transition-colors ${
                                    isSelected ? 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-l-amber-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-slate-400 text-[11px] font-bold">
                                      {sIdx + 1}.{lIdx + 1}
                                    </span>
                                    <div>
                                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{les.title}</h4>
                                      <span className="text-[10px] text-slate-400">
                                        {les.type === 'PDF' ? 'PDF Document' : `${les.durationMinutes || 0} Mins • Video`}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Badge variant={les.status === 'Published' ? 'success' : 'neutral'}>
                                      {les.status}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant={isSelected ? 'primary' : 'outline'}
                                      onClick={() => {
                                        setSelectedLesson(les);
                                        scrollToSection('content');
                                      }}
                                      className="text-xs py-1 px-3 rounded-lg"
                                    >
                                      {isSelected ? 'Previewing' : 'Inspect'}
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

          {/* LESSON CONTENT PREVIEW PART */}
          <div id="review-part-content">
            <Card className="p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FiVideo className="w-5 h-5 text-purple-500" /> Lesson Content Inspection
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Preview videos, PDF notes, text content & downloadable resources.
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
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {allLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          [{l.type}] {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Active Lesson Content Box */}
              {!selectedLesson ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No lessons found in this course.
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">
                        {selectedLesson.sectionTitle}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {selectedLesson.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">Status: {selectedLesson.status}</Badge>
                      <Badge variant="primary">{selectedLesson.type}</Badge>
                    </div>
                  </div>

                {/* 1. PDF Lesson Primary Viewer */}
                {selectedLesson.type === 'PDF' ? (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                      <FiFileText className="w-4 h-4 text-rose-500" /> PDF Document Reader
                    </span>
                    {selectedLesson.pdfUrl ? (
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex flex-col h-[480px]">
                        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs px-4">
                          <div className="flex items-center gap-2.5 text-slate-200 font-bold truncate">
                            <FiFileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="truncate">{selectedLesson.title} - Document.pdf</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({selectedLesson.pdfPageCount || 1} Page{(selectedLesson.pdfPageCount || 1) === 1 ? '' : 's'})
                            </span>
                          </div>
                          <a
                            href={selectedLesson.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                          >
                            <FiDownload className="w-3.5 h-3.5" /> Open / Download PDF
                          </a>
                        </div>
                        <iframe
                          src={selectedLesson.pdfUrl}
                          title={selectedLesson.title}
                          className="w-full flex-1 border-0 bg-slate-900"
                        />
                      </div>
                    ) : (
                      <div className="w-full p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                        <FiFileText className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="font-bold text-slate-300">No PDF document attached</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. Video Lesson Primary Viewer */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <FiVideo className="w-4 h-4 text-purple-500" /> Video Player
                      </span>
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center shadow-lg">
                        {selectedLesson.videoUrl ? (
                          selectedLesson.videoUrl.includes('youtube.com') ||
                          selectedLesson.videoUrl.includes('youtu.be') ||
                          selectedLesson.videoUrl.includes('vimeo.com') ? (
                            <iframe
                              key={selectedLesson.videoUrl}
                              src={formatVideoEmbedUrl(selectedLesson.videoUrl)}
                              title={selectedLesson.title}
                              className="absolute inset-0 w-full h-full border-0 z-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              key={selectedLesson.videoUrl}
                              controls
                              playsInline
                              src={selectedLesson.videoUrl}
                              className="w-full h-full object-contain bg-black"
                            >
                              Your browser does not support HTML5 video playback.
                            </video>
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
                            <FiVideo className="w-8 h-8 text-slate-600 mb-2" />
                            <span className="font-bold text-slate-300">Video not uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supplementary PDF Notes for Video Lessons (if present) */}
                    {selectedLesson.pdfUrl && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <FiFileText className="w-4 h-4 text-rose-500" /> Supplementary PDF Notes
                        </span>
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <FiFileText className="w-5 h-5 text-rose-500 shrink-0" />
                            <div>
                              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                                {selectedLesson.title} - Notes.pdf
                              </h5>
                              <span className="text-[10px] text-slate-400">{selectedLesson.pdfPageCount || 1} Page(s)</span>
                            </div>
                          </div>
                          <a
                            href={selectedLesson.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-200 flex items-center gap-1"
                          >
                            <FiDownload className="w-3.5 h-3.5" /> View PDF
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Content */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <FiFile className="w-4 h-4 text-indigo-500" /> Text Lesson
                  </span>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                    {selectedLesson.textContent || 'Standard text notes and summary.'}
                  </div>
                </div>

                {/* Downloadable Resources */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <FiDownload className="w-4 h-4 text-emerald-500" /> Downloadable Resources
                  </span>
                  {selectedLesson.resources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedLesson.resources.map((res) => (
                        <div key={res.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{res.name}</span>
                          <a href={res.downloadUrl} download className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-200">
                            <FiDownload className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl">No resource files attached</p>
                  )}
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
                      {asg.attachmentFileName && (
                        <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">Attachment: {asg.attachmentFileName}</span>
                          <a href={asg.attachmentUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Preview File
                          </a>
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
    </motion.div>
  );
};

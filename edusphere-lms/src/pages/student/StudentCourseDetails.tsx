import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiPlayCircle,
  FiFileText,
  FiAward,
  FiGlobe,
  FiCalendar,
  FiCheckCircle,
  FiLock,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiBookOpen,
  FiVideo,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { enrollmentService } from '../../services/enrollmentService';
import { progressService } from '../../services/progressService';
import { useAuth } from '../../contexts/AuthContext';
import { CourseReviewsSection } from '../../components/reviews/CourseReviewsSection';
import { PromotionalVideoModal } from '../../components/common/PromotionalVideoModal';
import type { Course } from '../../types';

export const StudentCourseDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [openModuleIdx, setOpenModuleIdx] = useState<number | null>(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);

  // 1. Fetch real course details with React Query (5-min staleTime)
  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course-details', slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await courseService.getCourseByIdOrSlug(slug);
      return res.data || null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const [courseOverride, setCourseOverride] = useState<Partial<Course> | null>(null);
  const course = useMemo(() => {
    if (!courseData) return null;
    return courseOverride ? { ...courseData, ...courseOverride } : courseData;
  }, [courseData, courseOverride]);

  const handleRatingUpdated = useCallback((newAvg: number, newCount: number) => {
    setCourseOverride((prev) => ({ ...(prev || {}), rating: newAvg, reviewsCount: newCount }));
  }, []);

  const courseId = course?.id || slug;

  // 2. Fetch live curriculum with React Query (5-min staleTime)
  const { data: curriculumModules = [] } = useQuery({
    queryKey: ['course-curriculum', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const res = await curriculumService.getPublicCourseCurriculum(courseId);
      if (res.success && res.data?.modules && res.data.modules.length > 0) {
        return res.data.modules.map((m, mIdx) => ({
          title: `Module ${mIdx + 1}: ${m.title}`,
          lessonsCount: m.lessons.length,
          duration: `${m.lessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)} mins`,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            duration:
              l.lessonType === 'PDF' || l.lessonType?.toLowerCase() === 'pdf'
                ? 'PDF Document'
                : `${l.durationMinutes || 10} mins`,
            isPreview: l.isPreview,
            type: l.lessonType,
          })),
        }));
      }
      return [];
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  // 3. Fetch real authenticated student enrollment for this specific course
  const { data: studentEnrollment } = useQuery({
    queryKey: ['student-enrollments-detail', currentUser?.id],
    queryFn: async () => {
      const res = await enrollmentService.getStudentEnrollments(true);
      return res.data || [];
    },
    enabled: !!currentUser?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const userEnrollment = useMemo(() => {
    if (!studentEnrollment || !courseId) return null;
    return studentEnrollment.find((e) => e.courseId === courseId || e.courseId === slug) || null;
  }, [studentEnrollment, courseId, slug]);

  const isEnrolled = !!userEnrollment;

  // 4. Fetch course progress for enrolled student
  const { data: progressData } = useQuery({
    queryKey: ['course-progress-detail', courseId, currentUser?.id],
    queryFn: async () => {
      if (!courseId) return null;
      const res = await progressService.getCourseProgress(courseId);
      return res.data || null;
    },
    enabled: !!(isEnrolled && courseId && currentUser?.id),
    staleTime: 5 * 60 * 1000,
  });

  const progressPercent = progressData?.lessonProgressPercentage || 0;
  const isCompleted = Boolean(
    progressData?.isCourseCompleted ||
    progressData?.certificateAvailable ||
    userEnrollment?.status === 'Completed'
  );
  const isLoading = isCourseLoading;

  const learningOutcomes = [
    'Build production-ready applications with clean architecture.',
    'Implement industry standard best practices and modular design.',
    'Structure scalable and maintainable solutions with type safety.',
    'Master key concepts, practical workflows, and real-world debugging.',
  ];

  const courseFaqs = [
    {
      q: 'Do I get lifetime access to all course materials?',
      a: 'Yes! Once you enroll, you enjoy permanent access to all video lessons, lecture notes, and practical exercises.',
    },
    {
      q: 'Is there a completion certificate included?',
      a: 'Absolutely. Upon completing 100% of the lessons, laboratory assignments, and knowledge quizzes, an official verifiable certificate is generated.',
    },
    {
      q: 'What prerequisites are required?',
      a: 'Basic knowledge of the core concepts in this field is recommended to get the most out of the course curriculum.',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <SkeletonLoader className="h-14 w-full rounded-2xl" />
        <SkeletonLoader className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonLoader className="h-48 w-full rounded-2xl" />
            <SkeletonLoader className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <SkeletonLoader className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Course Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The course you are looking for could not be found or is no longer available.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/student/courses')}>
          Return to My Courses
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Top Bar: Navigation Back to Student Portal Courses */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to My Courses
        </Button>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/student" className="hover:text-brand-600">Student Portal</Link>
          <span>/</span>
          <Link to="/student/courses" className="hover:text-brand-600">My Courses</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
            {course.title}
          </span>
        </div>
      </div>

      {/* 1. Course Header / Hero Section inside Student Portal */}
      <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{course.category || 'Masterclass'}</Badge>
            <Badge variant="neutral">{course.level || 'All Levels'}</Badge>
            {isEnrolled ? (
              <Badge variant="success" className="flex items-center gap-1 bg-emerald-600 text-white font-bold">
                <FiCheckCircle className="w-3.5 h-3.5" /> {isCompleted ? 'Completed Course' : 'Enrolled Course'}
              </Badge>
            ) : (
              <Badge variant="warning">Available for Enrollment</Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{course.title}</h1>
          <p className="text-slate-300 text-sm leading-relaxed">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              ⭐ {course.rating ? Number(course.rating).toFixed(1) : '5.0'} ({course.reviewsCount || 0} reviews)
            </span>
            <span>• {course.studentsEnrolled || 0} Students Enrolled</span>

            <span className="flex items-center gap-1">
              <FiUser className="w-3.5 h-3.5" /> Instructor: {course.instructorName || 'Lead Instructor'}
            </span>
            {course.updatedAt && (
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3.5 h-3.5" /> Updated {course.updatedAt}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Course Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Learning Outcomes */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-brand-600" />
              <span>What You'll Learn</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Course Curriculum Accordion */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Course Curriculum</h2>
            <div className="space-y-3">
              {curriculumModules.length === 0 ? (
                <Card className="p-6 text-center text-slate-500 text-xs">
                  Curriculum lessons are loaded in the course player.
                </Card>
              ) : (
                curriculumModules.map((module, modIdx) => (
                  <Card key={modIdx} className="p-0 overflow-hidden">
                    <button
                      onClick={() => setOpenModuleIdx(openModuleIdx === modIdx ? null : modIdx)}
                      className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 font-semibold text-sm text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        {openModuleIdx === modIdx ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        <span>{module.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-normal">
                        {module.lessonsCount} lessons • {module.duration}
                      </span>
                    </button>

                    {openModuleIdx === modIdx && (
                      <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                        {module.lessons.map((lesson: any, lesIdx: number) => (
                          <div
                            key={lesIdx}
                            onClick={() => {
                              if (isEnrolled) navigate(`/student/player/${course.id}`);
                            }}
                            className={`py-2.5 flex justify-between items-center text-xs ${
                              isEnrolled ? 'cursor-pointer hover:text-brand-600 transition-colors' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FiPlayCircle className={`w-4 h-4 ${isEnrolled ? 'text-emerald-500' : 'text-brand-600'}`} />
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{lesson.title}</span>
                              {lesson.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                              <span>{lesson.duration}</span>
                              {!isEnrolled && !lesson.isPreview && <FiLock className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Requirements & Target Audience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Prerequisites & Requirements</h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Basic understanding of the subject matter</li>
                <li>Computer with internet connection</li>
                <li>Desire to learn and build practical skills</li>
              </ul>
            </Card>

            <Card className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Target Audience</h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Students and aspiring professionals</li>
                <li>Developers looking to expand practical knowledge</li>
                <li>Anyone seeking certified technical expertise</li>
              </ul>
            </Card>
          </div>

          {/* Instructor Bio Section */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Instructor</h2>
            <div className="flex gap-4 items-center">
              <img
                src={course.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={course.instructorName || 'Instructor'}
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-500"
              />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {course.instructorName || 'Lead Instructor'}
                </h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                  Principal Instructor & Subject Expert
                </p>
                <div className="flex gap-3 text-xs text-slate-500 pt-1">
                  <span>⭐ {course.rating ? Number(course.rating).toFixed(1) : '5.0'} Rating</span>
                  <span>• Certified EduSphere Mentor</span>
                </div>

              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Experienced educator with dedicated industry and academic expertise, delivering comprehensive curriculum modules and hands-on guidance.
            </p>
          </Card>

          {/* FAQs Accordion */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
            {courseFaqs.map((faq, idx) => (
              <Card key={idx} className="cursor-pointer space-y-2" onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}>
                <div className="flex justify-between items-center font-semibold text-sm text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-2"><FiHelpCircle className="w-4 h-4 text-brand-500" /> {faq.q}</span>
                  <span>{openFaqIdx === idx ? '−' : '+'}</span>
                </div>
                {openFaqIdx === idx && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Student Reviews & Ratings Section */}
          <CourseReviewsSection
            courseId={course.id}
            courseTitle={course.title}
            isEnrolled={isEnrolled}
            isCourseCompleted={isCompleted || progressPercent >= 100}
            completedLessonsCount={progressData?.completedLessons}
            totalLessonsCount={progressData?.totalLessons}
            currentUserId={currentUser?.id}
            onRatingUpdated={handleRatingUpdated}
          />
        </div>



        {/* Sticky Action Card (Right Column) */}
        <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-6">
          <Card className="p-6 space-y-5 shadow-xl border-brand-100 dark:border-brand-900">
            {/* Course Thumbnail with Video Preview Play Overlay (Only shown if instructor uploaded a promo video) */}
            <div 
              className={`relative w-full h-44 rounded-xl overflow-hidden group ${course.promoVideoUrl ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (course.promoVideoUrl) {
                  setIsPromoModalOpen(true);
                }
              }}
            >
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'}
                alt={course.title}
                className={`w-full h-full object-cover transition-transform duration-300 ${course.promoVideoUrl ? 'group-hover:scale-105' : ''}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800';
                }}
              />
              {Boolean(course.promoVideoUrl?.trim()) && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <FiPlayCircle className="w-7 h-7" />
                  </div>
                  <span className="mt-2 text-[11px] font-bold text-white tracking-wide bg-black/60 px-2.5 py-0.5 rounded-full">
                    Watch Promo Video
                  </span>
                </div>
              )}
            </div>

            {/* If Enrolled: Show Real Status and "Go to Course" */}
            {isEnrolled ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{isCompleted ? '100% Completed' : `${progressPercent}% Progress`}</span>
                  </span>
                  <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Active Access
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full py-3.5 justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md flex items-center gap-2"
                  onClick={() => navigate(`/student/player/${course.id}`)}
                >
                  <FiPlayCircle className="w-5 h-5" />
                  <span>Go to Course</span>
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-xs flex items-center gap-1.5"
                  onClick={() => navigate(`/student/chat?courseId=${course.id}`)}
                >
                  <FiBookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Chat with Instructor</span>
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-xs"
                  onClick={() => navigate('/student/courses')}
                >
                  Return to My Courses
                </Button>
              </div>
            ) : (
              /* If NOT Enrolled: Show Price & "Buy Now" */
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      ₹{(course.discountPrice || course.price || 0).toLocaleString('en-IN')}
                    </span>
                    {course.discountPrice && course.price > course.discountPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{course.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">One-time payment • Lifetime access</span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full py-3.5 justify-center bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-md"
                  onClick={() => navigate(`/student/checkout?courseId=${course.id}`)}
                >
                  Buy Now (₹{(course.discountPrice || course.price || 0).toLocaleString('en-IN')})
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center text-xs"
                  onClick={() => navigate('/student/browse')}
                >
                  Browse More Courses
                </Button>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200">Course Access Includes:</p>
              <div className="flex items-center gap-2">
                <FiVideo className="w-4 h-4 text-brand-500" /> {course.durationHours || 4} hours video lessons
              </div>
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-brand-500" /> Interactive assignments & quizzes
              </div>
              <div className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-brand-500" /> Verified Certificate of Completion
              </div>
              <div className="flex items-center gap-2">
                <FiGlobe className="w-4 h-4 text-brand-500" /> Lifetime Portal Access
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Promotional Video Lightbox Modal */}
      <PromotionalVideoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        videoUrl={course.promoVideoUrl}
        courseTitle={course.title}
      />
    </motion.div>
  );
};

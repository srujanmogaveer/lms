import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FiVideo, 
  FiFileText, 
  FiAward, 
  FiGlobe, 
  FiCalendar, 
  FiCheckCircle, 
  FiLock, 
  FiPlayCircle, 
  FiUser, 
  FiChevronDown, 
  FiChevronUp,
  FiHelpCircle
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CourseCard } from '../../components/cards/CourseCard';
import { CourseReviewsSection } from '../../components/reviews/CourseReviewsSection';
import { courseService } from '../../services/courseService';
import { curriculumService } from '../../services/curriculumService';
import { mockCourses } from '../../data/dummyData';

export const CourseDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [openModuleIdx, setOpenModuleIdx] = useState<number | null>(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Scroll to top when course slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Dynamic Course Data with API & Mock fallback
  const { data: apiCourse } = useQuery({
    queryKey: ['public-course-details', slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        const res = await courseService.getCourseByIdOrSlug(slug);
        return res.data || null;
      } catch {
        return null;
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const course = apiCourse || mockCourses.find((c) => c.slug === slug || c.id === slug) || mockCourses[0];

  // Dynamic Curriculum from API if available
  const { data: apiCurriculum } = useQuery({
    queryKey: ['public-course-curriculum', course?.id],
    queryFn: async () => {
      if (!course?.id) return null;
      try {
        const res = await curriculumService.getPublicCourseCurriculum(course.id);
        return res.data || null;
      } catch {
        return null;
      }
    },
    enabled: !!course?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Related Courses dynamically
  const { data: relatedCoursesData } = useQuery({
    queryKey: ['public-related-courses', course?.category],
    queryFn: async () => {
      try {
        const res = await courseService.getPublicCourses({ 
          category: course?.category !== 'All' ? course?.category : undefined, 
          limit: 4 
        });
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const relatedCourses = useMemo(() => {
    const list = relatedCoursesData && relatedCoursesData.length > 0 
      ? relatedCoursesData.filter((c) => c.id !== course.id).slice(0, 3) 
      : mockCourses.filter((c) => c.id !== course.id).slice(0, 3);
    return list.length > 0 ? list : mockCourses.slice(0, 3);
  }, [relatedCoursesData, course.id]);

  const defaultModules = [
    {
      title: 'Module 1: Getting Started & Environment Setup',
      lessonsCount: 4,
      duration: '45 mins',
      lessons: [
        { title: 'Welcome & Course Roadmap', duration: '08:20', isPreview: true },
        { title: 'Installing Tools & Extension Config', duration: '12:45', isPreview: false },
        { title: 'Project Architecture Overview', duration: '15:10', isPreview: false },
        { title: 'First Hello World Setup', duration: '09:15', isPreview: false },
      ],
    },
    {
      title: 'Module 2: Core Fundamentals & Patterns',
      lessonsCount: 6,
      duration: '2 hours 15 mins',
      lessons: [
        { title: 'Understanding State & Props', duration: '18:30', isPreview: false },
        { title: 'Component Lifecycle & Hooks', duration: '24:10', isPreview: false },
        { title: 'Form Input Handling & Validation', duration: '22:00', isPreview: false },
      ],
    },
    {
      title: 'Module 3: Production Deployment & Best Practices',
      lessonsCount: 5,
      duration: '1 hour 50 mins',
      lessons: [
        { title: 'Build Optimization & Tree Shaking', duration: '20:15', isPreview: false },
        { title: 'Deploying to Vercel & Supabase Backend', duration: '25:40', isPreview: false },
      ],
    },
  ];

  const curriculumModules = useMemo(() => {
    if (apiCurriculum?.modules && apiCurriculum.modules.length > 0) {
      return apiCurriculum.modules.map((m, idx) => ({
        title: m.title || `Module ${idx + 1}`,
        lessonsCount: m.lessons?.length || 0,
        duration: `${m.lessons?.reduce((acc, l) => acc + (l.durationMinutes || 0), 0) || 0} mins`,
        lessons: (m.lessons || []).map((l) => ({
          title: l.title,
          duration: `${l.durationMinutes || 10}:00`,
          isPreview: l.isPreview,
        })),
      }));
    }
    return defaultModules;
  }, [apiCurriculum]);

  const learningOutcomes = course.learningOutcomes && course.learningOutcomes.length > 0 
    ? course.learningOutcomes 
    : [
      'Build production-ready web applications using modern React & TypeScript.',
      'Implement accessible UI components adhering to WCAG AA guidelines.',
      'Structure clean, modular backend API endpoints with Zod validation.',
      'Master state management, custom hooks, and performance optimization.',
    ];

  const courseRequirements = course.requirements && course.requirements.length > 0
    ? course.requirements
    : [
      'Basic understanding of HTML, CSS, and JS',
      'Node.js installed on your computer',
      'A code editor like Visual Studio Code',
    ];

  const courseFaqs = [
    { q: 'Do I get lifetime access to all course materials?', a: 'Yes! Once you enroll, you enjoy permanent access to all video lessons and downloadable code resources.' },
    { q: 'Is there a completion certificate included?', a: 'Absolutely. Upon completing 100% of the lessons and quizzes, a verifiable certificate is generated.' },
    { q: 'What prerequisites are required?', a: 'Basic knowledge of HTML, CSS, and JavaScript fundamentals is recommended.' },
  ];

  const handlePreviewClick = () => {
    const el = document.getElementById('curriculum-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setOpenModuleIdx(0);
    }
  };

  return (
    <div className="space-y-12 py-8 overflow-hidden">
      
      {/* 1. Course Header / Hero Section */}
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">{course.category}</Badge>
              <Badge variant="neutral">{course.level}</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{course.title}</h1>
            <p className="text-slate-300 text-sm leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                ⭐ {course.rating ? Number(course.rating).toFixed(1) : '5.0'} ({course.reviewsCount || 0} reviews)
              </span>
              <span>• {course.studentsEnrolled || 0} Students Enrolled</span>
              <span className="flex items-center gap-1"><FiUser className="w-3.5 h-3.5" /> Created by {course.instructorName}</span>
              <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> Updated {course.updatedAt || 'Recently'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content & Sticky Pricing Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Course Content (Left Column) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Learning Outcomes */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">What You'll Learn</h2>
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
            <div id="curriculum-section" className="space-y-4 scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Course Curriculum</h2>
              <div className="space-y-3">
                {curriculumModules.map((module, modIdx) => (
                  <Card key={modIdx} className="p-0 overflow-hidden">
                    <button
                      onClick={() => setOpenModuleIdx(openModuleIdx === modIdx ? null : modIdx)}
                      className="w-full p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 font-semibold text-sm text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        {openModuleIdx === modIdx ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        <span>{module.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-normal">{module.lessonsCount} lessons • {module.duration}</span>
                    </button>

                    {openModuleIdx === modIdx && (
                      <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                        {module.lessons.map((lesson, lesIdx) => (
                          <div key={lesIdx} className="py-2.5 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <FiPlayCircle className="w-4 h-4 text-brand-600" />
                              <span className="text-slate-700 dark:text-slate-300">{lesson.title}</span>
                              {lesson.isPreview && <Badge variant="success" size="sm">Preview</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                              <span>{lesson.duration}</span>
                              {!lesson.isPreview && <FiLock className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Requirements & Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Requirements</h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                  {courseRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </Card>

              <Card className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Target Audience</h3>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Aspiring Full-Stack Developers</li>
                  <li>Frontend Engineers expanding to Node.js</li>
                  <li>Computer Science & Engineering Students</li>
                </ul>
              </Card>
            </div>

            {/* Instructor Bio Section */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your Instructor</h2>
              <div className="flex gap-4 items-center">
                <img 
                  src={course.instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'} 
                  alt={course.instructorName} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-500" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructorName || 'Instructor')}&background=4f46e5&color=fff&size=200`;
                  }}
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{course.instructorName}</h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Principal Instructor & Mentor</p>
                  <div className="flex gap-3 text-xs text-slate-500 pt-1">
                    <span>⭐ {course.rating ? Number(course.rating).toFixed(1) : '5.0'} Rating</span>
                    <span>• {course.studentsEnrolled || 0} Students</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Expert software practitioner with years of industry experience mentoring aspiring engineers and delivering robust applications.
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
              isEnrolled={false}
            />

          </div>

          {/* Sticky Pricing Sidebar Card (Right Column) */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-6">
            <Card className="p-6 space-y-6 shadow-xl border-brand-100 dark:border-brand-900">
              <img 
                src={course.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'} 
                alt={course.title} 
                className="w-full h-44 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800';
                }}
              />
              
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">₹{(course.discountPrice || course.price || 0).toLocaleString('en-IN')}</span>
                  {course.discountPrice && course.discountPrice < course.price && (
                    <span className="text-sm text-slate-400 line-through">₹{course.price.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <Badge variant="danger" size="sm">Limited Time Offer</Badge>
              </div>

              <div className="space-y-2">
                <Link to="/auth/student-login">
                  <Button variant="primary" className="w-full py-3">
                    Sign In to Enroll
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={handlePreviewClick}>
                  Preview Course
                </Button>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-slate-200">This Course Includes:</p>
                <div className="flex items-center gap-2"><FiVideo className="w-4 h-4 text-brand-500" /> {course.durationHours || 12} hours video</div>
                <div className="flex items-center gap-2"><FiFileText className="w-4 h-4 text-brand-500" /> Downloadable resources</div>
                <div className="flex items-center gap-2"><FiAward className="w-4 h-4 text-brand-500" /> Certificate of Completion</div>
                <div className="flex items-center gap-2"><FiGlobe className="w-4 h-4 text-brand-500" /> Full lifetime access</div>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* 3. Related Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Related Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedCourses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

    </div>
  );
};

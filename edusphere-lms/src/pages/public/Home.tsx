import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiSearch, 
  FiUserPlus, 
  FiCode, 
  FiCpu, 
  FiDatabase, 
  FiShield, 
  FiCloud, 
  FiBriefcase, 
  FiLayout, 
  FiTrendingUp, 
  FiAward, 
  FiBookOpen, 
  FiCheckCircle, 
  FiClock, 
  FiArrowRight, 
  FiChevronDown, 
  FiUsers,
  FiStar,
  FiPlay,
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CourseCard } from '../../components/cards/CourseCard';
import { mockCourses } from '../../data/dummyData';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import type { Course } from '../../types';

export const Home: React.FC = () => {

  const categories = [
    { name: 'Programming', coursesCount: 42, icon: FiCode },
    { name: 'AI & Machine Learning', coursesCount: 28, icon: FiCpu },
    { name: 'Data Science', coursesCount: 35, icon: FiDatabase },
    { name: 'Cyber Security', coursesCount: 19, icon: FiShield },
    { name: 'Cloud Computing', coursesCount: 24, icon: FiCloud },
    { name: 'Business', coursesCount: 31, icon: FiBriefcase },
    { name: 'UI/UX Design', coursesCount: 22, icon: FiLayout },
    { name: 'Digital Marketing', coursesCount: 18, icon: FiTrendingUp },
  ];

  // Dynamic live states with graceful fallback to mock data
  const [courses, setCourses] = useState<Course[]>(mockCourses.slice(0, 3));
  const [platformStats, setPlatformStats] = useState({
    activeStudents: 25000,
    expertInstructors: 120,
    publishedCourses: 450,
    certificatesAwarded: 15000,
  });
  const [dynamicCategories, setDynamicCategories] = useState(categories);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch real published courses from database
    courseService.getPublicCourses({ limit: 3, sort: 'rating' })
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setCourses(res.data);
        }
      })
      .catch(() => {});

    // 2. Fetch real aggregate platform stats from database
    courseService.getPublicPlatformStats()
      .then((res) => {
        if (isMounted && res.data) {
          setPlatformStats({
            activeStudents: res.data.activeStudents > 0 ? res.data.activeStudents : 25000,
            expertInstructors: res.data.expertInstructors > 0 ? res.data.expertInstructors : 120,
            publishedCourses: res.data.publishedCourses > 0 ? res.data.publishedCourses : 450,
            certificatesAwarded: res.data.certificatesAwarded > 0 ? res.data.certificatesAwarded : 15000,
          });
        }
      })
      .catch(() => {});

    // 3. Fetch real categories from database
    categoryService.getCategories(true)
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          const mapped = res.data.slice(0, 8).map((cat, idx) => ({
            name: cat.name,
            coursesCount: cat.totalCourses ?? (cat.subcategories?.length ? cat.subcategories.length * 4 : 12),
            icon: categories[idx % categories.length].icon,
          }));
          setDynamicCategories(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);


  return (
    <div className="overflow-hidden bg-[#ebf0f7] dark:bg-slate-950 transition-colors">
      
      {/* 1. Full-Screen Viewport Fitted Hero Section */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 sm:py-8 lg:py-10 overflow-hidden">
        {/* Animated gradient orb background — stretches 100% edge-to-edge */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Base non-white tinted backdrop in light mode / sleek dark in dark mode */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#dbe5f6]/80 via-[#ebf0f7] to-[#e2eaf5] dark:from-slate-950 dark:via-[#0c1022] dark:to-slate-950 transition-colors duration-300" />
          {/* Orb 1 — indigo, top-right */}
          <div className="hero-orb w-[700px] h-[700px] -top-56 -right-28 opacity-80 dark:opacity-50"
               style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.35), transparent 70%)', filter: 'blur(72px)', animation: 'orb-one 15s ease-in-out infinite' }} />
          {/* Orb 2 — violet, bottom-left */}
          <div className="hero-orb w-[560px] h-[560px] -bottom-36 -left-20 opacity-75 dark:opacity-45"
               style={{ background: 'radial-gradient(circle at center, rgba(139,92,246,0.30), transparent 70%)', filter: 'blur(80px)', animation: 'orb-two 12s ease-in-out infinite 1.5s' }} />
          {/* Orb 3 — sky-blue, center */}
          <div className="hero-orb w-[500px] h-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70 dark:opacity-35"
               style={{ background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.20), transparent 70%)', filter: 'blur(60px)', animation: 'orb-three 18s ease-in-out infinite 3s' }} />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-100 dark:opacity-40" style={{ backgroundImage: 'linear-gradient(to right, rgba(99,102,241,0.065) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.065) 1px, transparent 1px)', backgroundSize: '36px 36px', maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 40%, transparent 100%)' }} />
          {/* Soft tinted readability wash — light / dark adaptive */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ebf0f7]/40 via-transparent to-[#ebf0f7]/80 dark:from-slate-950/40 dark:via-transparent dark:to-slate-950/80 transition-colors duration-300" />
        </div>

        <div className="relative z-10 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 xl:gap-20 items-center my-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 sm:space-y-6"
          >
            <Badge variant="primary" size="md">✨ Next-Generation Educational Platform</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold tracking-tight leading-[1.1]">
              <span className="block text-slate-800 dark:text-slate-100 mb-1">Unlock Your</span>
              <span className="block text-slate-800 dark:text-slate-100 mb-1">Potential</span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                with EduSphere
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Empowering students, instructors, and institutions with an enterprise-grade Learning Management System. Master coding, design, AI, and business.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 sm:pt-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/courses">
                  <Button size="lg" variant="primary">
                    <FiSearch className="mr-2 w-5 h-5" /> Search Courses
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    <FiUserPlus className="mr-2 w-5 h-5" /> Become Instructor
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl blur-lg opacity-30 dark:opacity-50"></div>
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"
              alt="EduSphere Students"
              className="relative rounded-2xl shadow-2xl w-full object-cover h-[280px] sm:h-[340px] lg:h-[390px] xl:h-[430px] max-h-[48vh]"
            />
            {/* Top Floating Highlight Card with Subtle Levitation */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-3 -right-2 sm:-right-4 bg-[#f8fafc]/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-3"
            >
              <div className="p-2 sm:p-2.5 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-lg">
                <FiUsers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {platformStats.activeStudents.toLocaleString()}+ Students
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Enrolled Worldwide</p>
              </div>
            </motion.div>

            {/* Bottom Floating Highlight Card with Subtle Levitation */}
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -bottom-4 -left-2 sm:-left-4 bg-[#f8fafc]/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-3"
            >
              <div className="p-2 sm:p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                <FiAward className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {platformStats.certificatesAwarded.toLocaleString()}+ Certificates
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Verified &amp; Awarded</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="hidden lg:flex flex-col items-center justify-center pt-3 text-slate-400 dark:text-slate-500 cursor-pointer"
          onClick={() => {
            const statsEl = document.getElementById('platform-stats');
            statsEl?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Scroll to Explore</span>
          <FiChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* 2. Animated Statistics Banner */}
      <section id="platform-stats" className="text-white py-12 sm:py-14" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #7c3aed 100%)' }}>
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold">{platformStats.activeStudents.toLocaleString()}+</h3>
            <p className="text-xs sm:text-sm text-white/70 mt-1">Active Students</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold">{platformStats.expertInstructors.toLocaleString()}+</h3>
            <p className="text-xs sm:text-sm text-white/70 mt-1">Expert Instructors</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold">{platformStats.publishedCourses.toLocaleString()}+</h3>
            <p className="text-xs sm:text-sm text-white/70 mt-1">Curated Courses</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold">{platformStats.certificatesAwarded.toLocaleString()}+</h3>
            <p className="text-xs sm:text-sm text-white/70 mt-1">Certificates Awarded</p>
          </div>
        </div>
      </section>

      <div className="space-y-20 py-16">
        {/* 3. Trusted Partners — infinite marquee */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-5">
            Trusted by Global Tech &amp; Education Leaders
          </p>
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#ebf0f7] dark:from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#ebf0f7] dark:from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="animate-marquee gap-16 items-center opacity-50 grayscale">
              {['MICROSOFT','GOOGLE','AMAZON','META','IBM','MICROSOFT','GOOGLE','AMAZON','META','IBM'].map((brand, i) => (
                <span key={i} className="font-bold text-xl tracking-widest text-slate-700 whitespace-nowrap px-8">{brand}</span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 4. Course Categories — staggered reveal + hover glow */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="text-center space-y-2"
          >
            <Badge variant="neutral">Explore Domain Paths</Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Top Course Categories</h2>
            <div className="flex justify-center pt-1">
              <div className="h-1 w-14 rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #a855f7)' }} />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dynamicCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const hues = [240, 160, 38, 280, 200, 340, 20, 140];
              const hue = hues[idx % hues.length];
              return (
                <motion.div
                  key={cat.name}
                  variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="group bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200"
                  style={{ '--cat-hue': hue } as React.CSSProperties}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -12, 12, 0], scale: 1.15 }}
                    transition={{ duration: 0.45 }}
                    className="p-3.5 rounded-xl transition-colors duration-300"
                    style={{ background: `hsl(${hue},80%,95%)`, color: `hsl(${hue},70%,42%)` }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cat.name}</h3>
                    <p className="text-xs text-slate-400">{cat.coursesCount} Courses</p>
                  </div>
                  {/* hover shimmer line */}
                  <div
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                    style={{ background: `hsl(${hue},70%,55%)` }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* 5. Featured Courses — staggered fan-in */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
          >
            <div>
              <Badge variant="primary">Top Rated</Badge>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">Featured Masterclasses</h2>
              <div className="h-1 w-14 rounded-full mt-2" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #a855f7)' }} />
            </div>
            <Link to="/courses">
              <Button variant="ghost">View All Catalog <FiArrowRight className="ml-1 w-4 h-4" /></Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((c, i) => (
              <motion.div
                key={c.id}
                variants={{
                  hidden: { opacity: 0, y: 40, rotate: i === 0 ? -2 : i === 2 ? 2 : 0 },
                  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.55, ease: 'easeOut' } },
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                <CourseCard course={c} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 6. Why Choose EduSphere — staggered + icon hover float */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="bg-[#dfe7f2]/70 dark:bg-slate-900/60 py-16 border-y border-slate-200/80 dark:border-slate-800"
        >
          <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-12">
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="text-center space-y-2 max-w-2xl mx-auto"
            >
              <Badge variant="neutral">The EduSphere Advantage</Badge>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Why Learners Choose EduSphere</h2>
              <div className="flex justify-center pt-1">
                <div className="h-1 w-14 rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #a855f7)' }} />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: FiBookOpen,    color: 'text-brand-600',  bg: 'bg-brand-50 dark:bg-brand-950',   title: 'Expert Instructors',     desc: 'Learn directly from veteran architects and industry leaders.' },
                { icon: FiCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', title: 'Interactive Quizzes',     desc: 'Reinforce key concepts with instant feedback quizzes.' },
                { icon: FiAward,       color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950',   title: 'Verifiable Certificates', desc: 'Earn industry-recognized certificates upon completion.' },
                { icon: FiClock,       color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950',  title: 'Lifetime Access',         desc: 'Learn at your own pace with unlimited lifetime video access.' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <motion.div
                  key={title}
                  variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: 'easeOut' } } }}
                  whileHover={{ y: -6, boxShadow: '0 16px 40px -8px rgba(0,0,0,0.10)' }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="bg-[#f8fafc] dark:bg-slate-800 rounded-2xl p-5 space-y-3 border border-slate-200/90 dark:border-slate-700 cursor-default shadow-sm hover:shadow-md"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 2 }}
                    className={`inline-flex p-2.5 rounded-xl ${bg}`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </motion.div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 7. How EduSphere Works — sequential step reveal */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.18 } } }}
          className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8 text-center"
        >
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="text-3xl font-bold text-slate-900 dark:text-slate-100"
          >
            How EduSphere Works
          </motion.h2>
          <div className="flex justify-center -mt-4 mb-2">
            <div className="h-1 w-14 rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #a855f7)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {[
              { num: '01', label: 'Browse Catalog', icon: '🔍' },
              null,
              { num: '02', label: 'Enroll Course', icon: '📚' },
              null,
              { num: '03', label: 'Earn Certificate', icon: '🎓' },
            ].map((item, i) =>
              item === null ? (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } }}
                  className="hidden md:flex justify-center"
                >
                  {/* plain CSS bouncing arrow — no nested motion animate conflict */}
                  <FiArrowRight
                    className="w-6 h-6 text-brand-400"
                    style={{ animation: 'arrowBounce 1.4s ease-in-out infinite' }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 30, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } } }}
                  whileHover={{ y: -5, scale: 1.04 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-lg text-center cursor-default"
                >
                  <span className="text-3xl">{item.icon}</span>
                  {/* plain span — no nested motion animate to conflict with parent variants */}
                  <span
                    className="block text-2xl font-black text-brand-600"
                    style={{ animation: `stepPulse 2.5s ease-in-out ${i * 0.4}s infinite` }}
                  >
                    {item.num}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.label}</h4>
                </motion.div>
              )
            )}
          </div>
        </motion.section>
      </div>

    </div>
  );
};

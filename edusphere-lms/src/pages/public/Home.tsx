import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiCode, 
  FiCpu, 
  FiDatabase, 
  FiShield, 
  FiCloud, 
  FiBriefcase, 
  FiLayout, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiArrowRight, 
  FiChevronDown, 
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { CourseCard } from '../../components/cards/CourseCard';
import { AuraCanvas } from '../../components/public/AuraCanvas';
import { TiltCard } from '../../components/public/TiltCard';
import { Hero3DShowcase } from '../../components/public/Hero3DShowcase';
import { mockCourses } from '../../data/dummyData';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import type { Course } from '../../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  const categories = [
    { name: 'Programming', coursesCount: 42, icon: FiCode, hue: 235 },
    { name: 'AI & Machine Learning', coursesCount: 28, icon: FiCpu, hue: 275 },
    { name: 'Data Science', coursesCount: 35, icon: FiDatabase, hue: 190 },
    { name: 'Cyber Security', coursesCount: 19, icon: FiShield, hue: 340 },
    { name: 'Cloud Computing', coursesCount: 24, icon: FiCloud, hue: 215 },
    { name: 'Business & Leadership', coursesCount: 31, icon: FiBriefcase, hue: 160 },
    { name: 'UI/UX Design Systems', coursesCount: 22, icon: FiLayout, hue: 290 },
    { name: 'Growth Marketing', coursesCount: 18, icon: FiTrendingUp, hue: 35 },
  ];

  // Dynamic live states from database
  const [courses, setCourses] = useState<Course[]>([]);
  const [platformStats, setPlatformStats] = useState({
    activeStudents: 0,
    expertInstructors: 0,
    publishedCourses: 0,
    certificatesAwarded: 0,
  });
  const [dynamicCategories, setDynamicCategories] = useState(categories);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch real published courses from database
    courseService.getPublicCourses({ limit: 3, sort: 'rating' })
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setCourses(res.data);
        } else if (isMounted) {
          setCourses(mockCourses.slice(0, 3));
        }
      })
      .catch(() => {
        if (isMounted) setCourses(mockCourses.slice(0, 3));
      });

    // 2. Fetch real aggregate platform stats from database
    courseService.getPublicPlatformStats()
      .then((res) => {
        if (isMounted && res.data) {
          setPlatformStats({
            activeStudents: Number(res.data.activeStudents) || 0,
            expertInstructors: Number(res.data.expertInstructors) || 0,
            publishedCourses: Number(res.data.publishedCourses) || 0,
            certificatesAwarded: Number(res.data.certificatesAwarded) || 0,
          });
        }
      })
      .catch(() => {});

    // 3. Fetch real categories from database
    categoryService.getCategories(true)
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          const getCategoryMeta = (name: string, idx: number) => {
            const lower = name.toLowerCase();
            if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('machine')) {
              return { icon: FiCpu, hue: 275 };
            }
            if (lower.includes('web') || lower.includes('programming') || lower.includes('software')) {
              return { icon: FiCode, hue: 235 };
            }
            if (lower.includes('data') || lower.includes('analytics')) {
              return { icon: FiDatabase, hue: 190 };
            }
            if (lower.includes('security') || lower.includes('cyber')) {
              return { icon: FiShield, hue: 340 };
            }
            if (lower.includes('cloud') || lower.includes('devops') || lower.includes('database')) {
              return { icon: FiCloud, hue: 215 };
            }
            if (lower.includes('business') || lower.includes('management') || lower.includes('leadership')) {
              return { icon: FiBriefcase, hue: 160 };
            }
            if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
              return { icon: FiLayout, hue: 290 };
            }
            if (lower.includes('mobile') || lower.includes('app')) {
              return { icon: FiTrendingUp, hue: 35 };
            }
            return {
              icon: categories[idx % categories.length].icon,
              hue: categories[idx % categories.length].hue,
            };
          };

          const mapped = res.data.slice(0, 8).map((cat, idx) => {
            const meta = getCategoryMeta(cat.name, idx);
            return {
              name: cat.name,
              coursesCount: cat.totalCourses || 0,
              icon: meta.icon,
              hue: meta.hue,
            };
          });
          setDynamicCategories(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/courses?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-[#03050c] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* ──────────────────────────────────────────────────────────────────────────
          GLOBAL COSMIC DEEP SPACE & NEBULA GLOW BACKGROUND
      ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. Deep Space Cosmic Micro-Stardust Shimmer */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 dark:opacity-30 bg-[radial-gradient(#818cf8_0.75px,transparent_0.75px)] [background-size:36px_36px]" />

      {/* 2. Hero Cosmic Ultraviolet Nebula (Ultraviolet & Royal Purple) */}
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1100px] h-[750px] bg-gradient-to-b from-indigo-900/30 via-purple-950/25 to-transparent dark:from-indigo-600/30 dark:via-purple-900/25 dark:to-transparent rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 3. Mid-Left Cyan & Sapphire Stardust Cloud */}
      <div className="absolute top-[32%] -left-48 w-[800px] h-[800px] bg-gradient-to-tr from-cyan-600/15 via-blue-900/15 to-transparent dark:from-cyan-500/20 dark:via-blue-950/20 dark:to-transparent rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 4. Mid-Right Deep Magenta & Astral Cloud */}
      <div className="absolute top-[52%] -right-48 w-[750px] h-[750px] bg-gradient-to-bl from-purple-800/15 via-pink-950/10 to-transparent dark:from-purple-700/20 dark:via-pink-900/15 dark:to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      {/* 5. Bottom Celestial Amber & Rose Nebula */}
      <div className="absolute bottom-5 left-1/3 w-[850px] h-[600px] bg-gradient-to-t from-rose-950/15 via-indigo-950/15 to-transparent dark:from-rose-900/15 dark:via-indigo-950/20 dark:to-transparent rounded-full blur-[160px] pointer-events-none z-0" />

      {/* ──────────────────────────────────────────────────────────────────────────
          1. IMMERSIVE 3D HERO SECTION (AuraCanvas + Floating Glass Badges)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 pb-16 overflow-hidden">
        
        {/* Interactive Particle & Cosmic Aura Background */}
        <AuraCanvas className="absolute inset-0 z-0 pointer-events-auto opacity-80" particleCount={75} speed={0.35} />

        <div className="relative z-10 w-full max-w-[1536px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-50/80 dark:bg-white/[0.05] border border-indigo-200/60 dark:border-white/[0.12] backdrop-blur-xl text-xs font-semibold text-indigo-600 dark:text-indigo-300 shadow-sm dark:shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping" />
              <HiSparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Next-Gen Enterprise Learning Architecture</span>
            </div>

            {/* Cinematic Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              Empower Your Future <br className="hidden sm:inline" />
              <span className="inline-flex items-center gap-2 flex-wrap">
                <span>with</span>
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                  EduSphere.
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              An all-in-one digital universe for modern learners and instructors. Explore interactive coding environments, live video classrooms, AI mentorship, and globally verifiable certifications.
            </p>

            {/* Hero Direct Search Bar */}
            <form onSubmit={handleHeroSearch} className="max-w-xl mx-auto lg:mx-0 pt-2">
              <div className="relative flex items-center p-1.5 rounded-2xl bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.14] backdrop-blur-xl shadow-lg dark:shadow-2xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 transition-all">
                <FiSearch className="w-5 h-5 ml-3.5 text-indigo-500 dark:text-indigo-400" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search Python, React, AI, Cloud, UI/UX..."
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold text-xs tracking-wide shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Explore</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> 100% Online &amp; Self-Paced
              </span>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Live Interactive Mentorship
              </span>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Verifiable Web3 / PDF Certificates
              </span>
            </div>
          </motion.div>

          {/* Right Hero 3D Interactive Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-6 relative flex justify-center items-center"
          >
            <Hero3DShowcase 
              activeStudents={platformStats.activeStudents}
              certificatesAwarded={platformStats.certificatesAwarded}
            />
          </motion.div>

        </div>

        {/* Scroll Prompt */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="hidden lg:flex flex-col items-center mt-12 text-slate-500 dark:text-slate-400 cursor-pointer"
          onClick={() => {
            document.getElementById('bento-features')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-1">Scroll to Explore</span>
          <FiChevronDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </motion.div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          2. LIVE STATISTICS AMBIENT BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative border-y border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.02] backdrop-blur-md py-10">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {platformStats.activeStudents.toLocaleString()}{platformStats.activeStudents >= 100 ? '+' : ''}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Global Active Students</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
              {platformStats.expertInstructors.toLocaleString()}{platformStats.expertInstructors >= 100 ? '+' : ''}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Industry Expert Mentors</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {platformStats.publishedCourses.toLocaleString()}{platformStats.publishedCourses >= 100 ? '+' : ''}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Curated Masterclasses</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent tracking-tight">
              {platformStats.certificatesAwarded.toLocaleString()}{platformStats.certificatesAwarded >= 100 ? '+' : ''}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Accredited Credentials</p>
          </div>
        </div>
      </section>





      {/* ──────────────────────────────────────────────────────────────────────────
          4. TOP COURSE CATEGORIES (With 3D Tilt & Neon Gradients)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Curated Domains</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Explore Learning Paths</h2>
          </div>
          <Link
            to="/courses"
            className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <span>View All Tracks</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TiltCard key={cat.name} tiltIntensity={8}>
                <Link
                  to={`/courses?category=${encodeURIComponent(cat.name)}`}
                  className="h-full block p-6 rounded-2xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] hover:border-indigo-500/50 dark:hover:border-indigo-400/40 backdrop-blur-xl shadow-md dark:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-white/[0.06]">
                      {cat.coursesCount} Courses
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-slate-300">
                    Explore track <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </p>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          5. FEATURED MASTERCLASSES & COURSES
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">Handpicked Quality</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Featured Masterclasses</h2>
          </div>
          <Link
            to="/courses"
            className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1.5"
          >
            <span>Explore Entire Catalog</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <TiltCard key={course.id} tiltIntensity={6}>
              <CourseCard course={course} mode="public" />
            </TiltCard>
          ))}
        </div>
      </section>


      {/* ──────────────────────────────────────────────────────────────────────────
          6. HOW IT WORKS (Cinematic 3-Step Flow)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How EduSphere Works
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            From discovering your path to earning industry-standard recognition in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            { step: '01', title: 'Choose Your Specialization', desc: 'Select from 450+ courses crafted by senior engineers, architects, and industry leaders.', icon: '🎯' },
            { step: '02', title: 'Interactive Learning & AI Guidance', desc: 'Watch HD videos, build real-world capstone projects, and practice in real-time sandboxes.', icon: '⚡' },
            { step: '03', title: 'Get Verified & Land Top Roles', desc: 'Earn verifiable certificates, showcase projects in your portfolio, and accelerate your career.', icon: '🏆' },
          ].map((item) => (
            <TiltCard key={item.step} tiltIntensity={8}>
              <div className="h-full rounded-3xl p-8 bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl relative overflow-hidden group">
                <span className="text-5xl font-black text-slate-900/10 dark:text-white/[0.07] absolute top-4 right-6 select-none group-hover:text-indigo-500/20 dark:group-hover:text-indigo-400/20 transition-colors">
                  {item.step}
                </span>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

    </div>
  );
};

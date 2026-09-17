import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTarget, 
  FiEye, 
  FiAward, 
  FiLinkedin, 
  FiTwitter, 
  FiGithub, 
  FiShield, 
  FiZap, 
  FiGlobe,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { TiltCard } from '../../components/public/TiltCard';
import { courseService } from '../../services/courseService';

export const About: React.FC = () => {
  const [platformStats, setPlatformStats] = useState<{
    activeStudents: number | null;
    expertInstructors: number | null;
    publishedCourses: number | null;
    certificatesAwarded: number | null;
  }>({
    activeStudents: null,
    expertInstructors: null,
    publishedCourses: null,
    certificatesAwarded: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [leadership, setLeadership] = useState<{
    id: string;
    name: string;
    role: string;
    photo: string;
    bio: string;
    qualification?: string;
    specialization?: string;
  }[]>([]);
  const [isLeadershipLoading, setIsLeadershipLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    courseService.getPublicPlatformStats()
      .then((res) => {
        if (isMounted && res.data) {
          setPlatformStats({
            activeStudents: res.data.activeStudents,
            expertInstructors: res.data.expertInstructors,
            publishedCourses: res.data.publishedCourses,
            certificatesAwarded: res.data.certificatesAwarded,
          });
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    courseService.getPublicLeadership()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setLeadership(res.data.slice(0, 3));
          setIsLeadershipLoading(false);
        } else {
          setIsLeadershipLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLeadershipLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const teamMembers = [
    {
      name: 'Dr. Marcus Vance',
      role: 'Founder & Chief Academic Officer',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      bio: 'Former Professor of Computer Science with 15+ years leading high-scale distributed engineering teams.',
    },
    {
      name: 'Elena Rostova',
      role: 'Head of Product & Experience',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      bio: 'Design systems pioneer passionate about creating immersive, frictionless digital learning spaces.',
    },
    {
      name: 'Sarah Connor',
      role: 'Head of Platform Infrastructure',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      bio: 'Distributed systems architect ensuring sub-second real-time classroom interactions globally.',
    },
  ];

  const coreValues = [
    { title: 'Excellence in Pedagogy', desc: 'Rigorous engineering curricula developed and peer-reviewed by principal industry architects.', icon: FiAward, hue: 'from-amber-500/20 to-orange-500/10' },
    { title: 'AI-Enhanced Mentorship', desc: 'Cutting-edge AI tutoring engines that provide contextual real-time feedback on your code and projects.', icon: FiZap, hue: 'from-indigo-500/20 to-purple-500/10' },
    { title: 'Global Accessibility', desc: 'Ultra-low latency streaming, full responsiveness, and inclusive multi-tier platform support worldwide.', icon: FiGlobe, hue: 'from-cyan-500/20 to-blue-500/10' },
    { title: 'Cryptographic Trust', desc: 'Immutable, verifiable credentials with instant employer verification and LinkedIn integrations.', icon: FiShield, hue: 'from-emerald-500/20 to-teal-500/10' },
  ];

  return (
    <div className="space-y-24 py-12 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-white/[0.06] border border-indigo-200/60 dark:border-white/[0.12] backdrop-blur-md text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <HiSparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Our Vision &amp; Philosophy</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Architecting Higher Education for the Next Century
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-base leading-relaxed">
          EduSphere is designed to bridge the gap between abstract academic theory and actual industry execution through high-impact, interactive digital ecosystems.
        </p>
      </section>

      {/* Live Platform Stats Strip */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl text-center">
          <div className="space-y-1">
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mx-auto mb-1" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {(platformStats.activeStudents ?? 0).toLocaleString()}
                {(platformStats.activeStudents ?? 0) >= 100 ? '+' : ''}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Students</p>
          </div>
          <div className="space-y-1">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mx-auto mb-1" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                {(platformStats.expertInstructors ?? 0).toLocaleString()}
                {(platformStats.expertInstructors ?? 0) >= 100 ? '+' : ''}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Industry Mentors</p>
          </div>
          <div className="space-y-1">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mx-auto mb-1" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {(platformStats.publishedCourses ?? 0).toLocaleString()}
                {(platformStats.publishedCourses ?? 0) >= 100 ? '+' : ''}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Curated Masterclasses</p>
          </div>
          <div className="space-y-1">
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse mx-auto mb-1" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                {(platformStats.certificatesAwarded ?? 0).toLocaleString()}
                {(platformStats.certificatesAwarded ?? 0) >= 100 ? '+' : ''}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Certificates Awarded</p>
          </div>
        </div>
      </section>

      {/* 2. Our Story Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Our Origin</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Why We Built EduSphere
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Traditional education platforms often struggle to simulate true production-grade complexity. We built EduSphere from the ground up as a unified modern learning ecosystem: live interactive workspaces, collaborative real-time code environments, and direct mentorship from leaders at top tech companies.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Whether you are an aspiring software engineer preparing for senior roles, or an institution scaling remote learning across continents, EduSphere provides an uncompromised foundation.
            </p>
          </motion.div>

          <TiltCard tiltIntensity={6}>
            <div className="relative rounded-3xl overflow-hidden p-2 bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.14] backdrop-blur-xl shadow-xl dark:shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                alt="EduSphere Vision"
                className="rounded-2xl w-full object-cover h-96 shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 dark:from-[#080b18]/80 via-transparent to-transparent rounded-2xl" />
            </div>
          </TiltCard>
        </div>
      </section>

      {/* 3. Mission & Vision Bento Cards */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <TiltCard tiltIntensity={6}>
          <div className="p-8 sm:p-10 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl space-y-4 h-full">
            <div className="p-3.5 bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-2xl w-fit shadow-md shadow-brand-500/25">
              <FiTarget className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              To democratize world-class technical education through high-fidelity, interactive, and community-driven learning architectures that enable students anywhere to master modern technology.
            </p>
          </div>
        </TiltCard>

        <TiltCard tiltIntensity={6}>
          <div className="p-8 sm:p-10 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl space-y-4 h-full">
            <div className="p-3.5 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-2xl w-fit shadow-md shadow-purple-500/25">
              <FiEye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              To become the global gold standard for technical education—connecting millions of students, seasoned instructors, and top tech employers through verified credentials and hands-on proof-of-work.
            </p>
          </div>
        </TiltCard>
      </section>

      {/* 4. Core Values */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Guiding Principles</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Core Values That Drive Us</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((val) => {
            const Icon = val.icon;
            return (
              <TiltCard key={val.title} tiltIntensity={8}>
                <div className="p-6 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-md dark:shadow-lg space-y-3 h-full group">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-white/[0.06] border border-indigo-200/60 dark:border-white/[0.08] w-fit text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{val.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{val.desc}</p>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* 5. Executive Leadership & Faculty */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Leadership &amp; Advisory</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Meet Our Academic Leaders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLeadershipLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="text-center space-y-4 p-8 rounded-3xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] animate-pulse">
                <div className="w-24 h-24 rounded-full mx-auto bg-slate-200 dark:bg-white/[0.08]" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 dark:bg-white/[0.08] mx-auto rounded" />
                  <div className="h-3 w-40 bg-slate-100 dark:bg-white/[0.05] mx-auto rounded" />
                </div>
                <div className="h-12 w-full bg-slate-100 dark:bg-white/[0.04] rounded" />
              </div>
            ))
          ) : (
            (leadership.length > 0 ? leadership : teamMembers).map((member) => (
              <TiltCard key={member.name} tiltIntensity={6}>
                <div className="text-center space-y-4 p-8 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <img 
                      src={member.photo} 
                      alt={member.name} 
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-indigo-500 shadow-xl bg-slate-900" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4f46e5&color=fff&size=200`;
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{member.name}</h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium capitalize mt-0.5">{member.role}</p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">{member.bio}</p>
                  </div>
                  <div className="flex justify-center gap-3 pt-4 text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/[0.06]">
                    <a href="#" className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-all"><FiLinkedin className="w-4 h-4" /></a>
                    <a href="#" className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-all"><FiTwitter className="w-4 h-4" /></a>
                    <a href="#" className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-all"><FiGithub className="w-4 h-4" /></a>
                  </div>
                </div>
              </TiltCard>
            ))
          )}
        </div>
      </section>

    </div>
  );
};

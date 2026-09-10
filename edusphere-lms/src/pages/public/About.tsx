import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTarget, 
  FiEye, 
  FiAward, 
  FiLinkedin, 
  FiTwitter, FiGithub, 
  FiArrowRight, 
  FiShield, 
  FiZap, 
  FiGlobe
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Heading1, Subtitle, Body } from '../../components/ui/Typography';
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
      bio: 'Former Professor of Computer Science with 15+ years leading web architecture teams.',
    },
    {
      name: 'Elena Rostova',
      role: 'Head of Product & Design',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      bio: 'Design systems advocate passionate about accessible human-centered interfaces.',
    },
    {
      name: 'Sarah Connor',
      role: 'Head of Platform Security',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      bio: 'Enterprise security specialist ensuring zero-trust infrastructure.',
    },
  ];

  const coreValues = [
    { title: 'Quality Education', desc: 'Rigorous curriculum vetted by industry experts.', icon: FiAward },
    { title: 'Innovation First', desc: 'Modern digital learning tools and interactive feedback.', icon: FiZap },
    { title: 'Universal Access', desc: 'Accessible across every device with responsive design.', icon: FiGlobe },
    { title: 'Security & Trust', desc: 'Enterprise-grade security and verifiable credentials.', icon: FiShield },
  ];

  return (
    <div className="space-y-20 py-8 overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center space-y-6">
        <Badge variant="primary" size="md">Empowering Learners Globally</Badge>
        <Heading1 className="max-w-3xl mx-auto">Reinventing Higher Education for the Modern Era</Heading1>
        <Subtitle className="max-w-2xl mx-auto">
          EduSphere LMS bridges the gap between industry experts and ambitious learners worldwide through scalable, accessible digital learning environments.
        </Subtitle>
      </section>

      {/* 2. Our Story Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <Badge variant="neutral">Our Genesis</Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Why EduSphere Was Created</h2>
            <Body>
              Traditional learning systems often fail to keep pace with rapid technological shifts. EduSphere was founded to provide a seamless, modular, enterprise-ready platform where students learn real-world skills through interactive masterclasses, assignments, and instant-feedback quizzes.
            </Body>
            <Body>
              Whether you are a student aiming to land your first software developer role, or an instructor looking to broadcast knowledge globally, EduSphere provides the tools you need.
            </Body>
          </motion.div>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl blur opacity-30"></div>
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
              alt="EduSphere Vision"
              className="relative rounded-2xl shadow-xl w-full object-cover h-80"
            />
          </div>
        </div>
      </section>

      {/* 3. Mission & Vision */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-4 bg-brand-50/40 dark:bg-slate-900 border-brand-200 dark:border-brand-900">
          <div className="p-3 bg-brand-600 text-white rounded-xl w-fit">
            <FiTarget className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Our Mission</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To democratize high-quality education by building an intuitive, accessible, and enterprise-grade Learning Management System that enables anyone, anywhere, to master modern skills.
          </p>
        </Card>

        <Card className="p-8 space-y-4 bg-indigo-50/40 dark:bg-slate-900 border-indigo-200 dark:border-indigo-900">
          <div className="p-3 bg-indigo-600 text-white rounded-xl w-fit">
            <FiEye className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Our Vision</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To become the worldwide standard for online education platforms—connecting millions of students, instructors, and institutions through verifiable credentials and interactive technology.
          </p>
        </Card>
      </section>

      {/* 4. Core Values */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="neutral">Our Foundation</Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Core Values That Drive Us</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((val) => {
            const Icon = val.icon;
            return (
              <Card key={val.title} hoverEffect className="space-y-3">
                <Icon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{val.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{val.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. Platform Statistics Banner */}
      <section className="bg-brand-600 dark:bg-slate-900 text-white py-12 sm:py-14">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold flex items-center justify-center min-h-[40px]">
              {isLoading ? (
                <span className="inline-block w-20 h-9 bg-white/20 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                `${(platformStats.activeStudents ?? 0).toLocaleString()}+`
              )}
            </h3>
            <p className="text-xs sm:text-sm text-brand-200 mt-1">Students Enrolled</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold flex items-center justify-center min-h-[40px]">
              {isLoading ? (
                <span className="inline-block w-20 h-9 bg-white/20 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                `${(platformStats.publishedCourses ?? 0).toLocaleString()}+`
              )}
            </h3>
            <p className="text-xs sm:text-sm text-brand-200 mt-1">Published Masterclasses</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold flex items-center justify-center min-h-[40px]">
              {isLoading ? (
                <span className="inline-block w-20 h-9 bg-white/20 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                `${(platformStats.expertInstructors ?? 0).toLocaleString()}+`
              )}
            </h3>
            <p className="text-xs sm:text-sm text-brand-200 mt-1">Verified Instructors</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-4xl font-extrabold flex items-center justify-center min-h-[40px]">
              {isLoading ? (
                <span className="inline-block w-20 h-9 bg-white/20 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                `${(platformStats.certificatesAwarded ?? 0).toLocaleString()}+`
              )}
            </h3>
            <p className="text-xs sm:text-sm text-brand-200 mt-1">Certificates Issued</p>
          </div>
        </div>
      </section>

      {/* 6. Meet Our Executive Leadership Team */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="primary">Leadership & Faculty</Badge>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Meet Our Executive & Academic Leaders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLeadershipLoading ? (
            [1, 2, 3].map((n) => (
              <Card key={n} className="text-center space-y-4 p-6 animate-pulse">
                <div className="w-24 h-24 rounded-full mx-auto bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 mx-auto rounded" />
                  <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 mx-auto rounded" />
                </div>
                <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
              </Card>
            ))
          ) : (
            (leadership.length > 0 ? leadership : teamMembers).map((member) => (
              <Card key={member.name} hoverEffect className="text-center space-y-4 p-6">
                <img 
                  src={member.photo} 
                  alt={member.name} 
                  className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-brand-500 shadow-md bg-slate-100 dark:bg-slate-800" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4f46e5&color=fff&size=200`;
                  }}
                />
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{member.name}</h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium capitalize">{member.role}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{member.bio}</p>
                <div className="flex justify-center gap-3 pt-2 text-slate-400">
                  <a href="#" className="hover:text-brand-600 transition-colors"><FiLinkedin className="w-4 h-4" /></a>
                  <a href="#" className="hover:text-brand-600 transition-colors"><FiTwitter className="w-4 h-4" /></a>
                  <a href="#" className="hover:text-brand-600 transition-colors"><FiGithub className="w-4 h-4" /></a>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* 7. Learning Journey Timeline */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">The EduSphere Learning Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
          <Card className="p-4 text-center"><span className="text-sm font-bold text-brand-600">Step 1</span><p className="text-xs font-semibold mt-1">Browse Catalog</p></Card>
          <FiArrowRight className="hidden md:block w-4 h-4 text-slate-300 mx-auto" />
          <Card className="p-4 text-center"><span className="text-sm font-bold text-brand-600">Step 2</span><p className="text-xs font-semibold mt-1">Enroll</p></Card>
          <FiArrowRight className="hidden md:block w-4 h-4 text-slate-300 mx-auto" />
          <Card className="p-4 text-center"><span className="text-sm font-bold text-brand-600">Step 3</span><p className="text-xs font-semibold mt-1">Learn & Quiz</p></Card>
          <FiArrowRight className="hidden md:block w-4 h-4 text-slate-300 mx-auto" />
          <Card className="p-4 text-center"><span className="text-sm font-bold text-brand-600">Step 4</span><p className="text-xs font-semibold mt-1">Earn Certificate</p></Card>
        </div>
      </section>

    </div>
  );
};

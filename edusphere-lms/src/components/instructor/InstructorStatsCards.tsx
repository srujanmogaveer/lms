import React from 'react';
import { motion } from 'framer-motion';
import {
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiUsers,
  FiClock,
  FiHelpCircle,
  FiVideo,
  FiDollarSign,
  FiTrendingUp,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface InstructorStatsCardsProps {
  stats?: any;
  onCardClick?: (statType: string) => void;
}

export const InstructorStatsCards: React.FC<InstructorStatsCardsProps> = ({ stats, onCardClick }) => {
  // Formatter for Indian Rupee currency
  const formatINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const activeStats = stats || {};

  const totalCoursesVal = activeStats.totalCourses ?? 0;
  const publishedCoursesVal = activeStats.publishedCourses ?? 0;
  const draftCoursesVal = activeStats.draftCourses ?? 0;
  const totalStudentsVal = activeStats.totalStudents ?? 0;
  const assignmentsPendingVal = activeStats.assignmentsPendingReview ?? 0;
  const quizzesPendingVal = activeStats.quizzesPendingReview ?? 0;
  const liveClassesVal = activeStats.liveClassesScheduled ?? 0;
  const totalRevenueVal = activeStats.totalRevenueINR ?? 0;

  const studentsGrowth = activeStats.studentsTrendPercent ?? 0;
  const revenueGrowth = activeStats.revenueTrendPercent ?? 0;

  const cards = [
    {
      id: 'total_courses',
      label: 'Total Courses',
      value: totalCoursesVal.toString(),
      trend: totalCoursesVal > 0 ? `${publishedCoursesVal} Published` : 'No courses',
      trendType: totalCoursesVal > 0 ? 'positive' : 'neutral',
      icon: FiBookOpen,
      color: 'brand',
      badgeBg: 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400',
    },
    {
      id: 'published_courses',
      label: 'Published Courses',
      value: publishedCoursesVal.toString(),
      trend: publishedCoursesVal > 0 ? 'Live in Catalog' : 'None Published',
      trendType: publishedCoursesVal > 0 ? 'positive' : 'neutral',
      icon: FiCheckCircle,
      color: 'emerald',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'draft_courses',
      label: 'Draft Courses',
      value: draftCoursesVal.toString(),
      trend: draftCoursesVal > 0 ? 'In Preparation' : 'No Drafts',
      trendType: 'neutral',
      icon: FiClock,
      color: 'amber',
      badgeBg: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'total_students',
      label: 'Total Students',
      value: totalStudentsVal.toLocaleString('en-IN'),
      trend: studentsGrowth !== 0 ? `${studentsGrowth > 0 ? '+' : ''}${studentsGrowth}% MoM` : 'Active Enrolled',
      trendType: studentsGrowth > 0 ? 'positive' : 'neutral',
      icon: FiUsers,
      color: 'indigo',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'pending_assignments',
      label: 'Assignments Pending',
      value: assignmentsPendingVal.toString(),
      trend: assignmentsPendingVal > 0 ? 'Needs Grading' : 'All Evaluated',
      trendType: assignmentsPendingVal > 0 ? 'warning' : 'positive',
      icon: FiFileText,
      color: 'rose',
      badgeBg: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'pending_quizzes',
      label: 'Quizzes Pending',
      value: quizzesPendingVal.toString(),
      trend: quizzesPendingVal > 0 ? 'Requests Pending' : 'Up to Date',
      trendType: quizzesPendingVal > 0 ? 'warning' : 'positive',
      icon: FiHelpCircle,
      color: 'purple',
      badgeBg: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'scheduled_live',
      label: 'Live Classes Scheduled',
      value: liveClassesVal.toString(),
      trend: liveClassesVal > 0 ? 'Upcoming Sessions' : 'None Scheduled',
      trendType: liveClassesVal > 0 ? 'positive' : 'neutral',
      icon: FiVideo,
      color: 'cyan',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'total_revenue',
      label: 'Total Revenue (₹)',
      value: formatINR(totalRevenueVal),
      trend: revenueGrowth !== 0 ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% Growth` : 'Course Sales',
      trendType: revenueGrowth > 0 ? 'positive' : 'neutral',
      icon: FiDollarSign,
      color: 'emerald',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Instructor Key Statistics"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            tabIndex={0}
            role="button"
            aria-label={`${card.label}: ${card.value}`}
            onClick={() => onCardClick && onCardClick(card.id)}
            className="h-full"
          >
            <Card
              hoverEffect
              className="p-5 flex flex-col justify-between h-full space-y-3 cursor-pointer group border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${card.badgeBg} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>

                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  card.trendType === 'positive'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : card.trendType === 'warning'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {card.trendType === 'positive' && <FiTrendingUp className="w-3 h-3" />}
                  {card.trend}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                  {card.label}
                </p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 group-hover:text-brand-600 transition-colors">
                  {card.value}
                </h2>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.section>
  );
};

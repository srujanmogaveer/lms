import React from 'react';
import {
  FiBookOpen,
  FiCheckCircle,
  FiAward,
  FiFileText,
  FiClock,
  FiZap,
  FiStar,
  FiLock,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { StudentAchievementBadge } from '../../types';

export interface StudentLearningStatsData {
  enrolledCourses: number;
  completedCourses: number;
  earnedCertificates: number;
  assignmentsSubmitted: number;
  quizzesPassed: number;
  totalStudyHours: number;
}

export interface StudentAchievementBadgeExtended extends StudentAchievementBadge {
  isUnlocked?: boolean;
  requirement?: string;
}

interface LearningStatsAndBadgesProps {
  achievements: StudentAchievementBadgeExtended[];
  learningStreakDays: number;
  stats?: StudentLearningStatsData;
}

export const LearningStatsAndBadges: React.FC<LearningStatsAndBadgesProps> = ({
  achievements,
  learningStreakDays,
  stats,
}) => {
  const enrolledCount = stats?.enrolledCourses ?? 0;
  const completedCount = stats?.completedCourses ?? 0;
  const certificatesCount = stats?.earnedCertificates ?? 0;
  const assignmentsCount = stats?.assignmentsSubmitted ?? 0;
  const quizzesCount = stats?.quizzesPassed ?? 0;
  const studyHours = stats?.totalStudyHours ?? 0;

  const statCards = [
    {
      title: 'Enrolled Courses',
      count: `${enrolledCount} ${enrolledCount === 1 ? 'Course' : 'Courses'}`,
      icon: <FiBookOpen className="w-5 h-5 text-brand-600" />,
      bg: 'bg-brand-50 dark:bg-brand-950/50',
    },
    {
      title: 'Completed Courses',
      count: `${completedCount} ${completedCount === 1 ? 'Course' : 'Courses'}`,
      icon: <FiCheckCircle className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Earned Certificates',
      count: `${certificatesCount} ${certificatesCount === 1 ? 'Verified' : 'Verified'}`,
      icon: <FiAward className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: 'Assignments Submitted',
      count: `${assignmentsCount} ${assignmentsCount === 1 ? 'Submitted' : 'Submitted'}`,
      icon: <FiFileText className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Quizzes Passed',
      count: `${quizzesCount} ${quizzesCount === 1 ? 'Passed' : 'Passed'}`,
      icon: <FiStar className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
      title: 'Total Study Time',
      count: `${studyHours} ${studyHours === 1 ? 'Hour' : 'Hours'}`,
      icon: <FiClock className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
  ];

  const unlockedCount = achievements.filter((a) => a.isUnlocked !== false).length;

  return (
    <div className="space-y-6">
      {/* 1. Learning Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((st) => (
          <Card key={st.title} hoverEffect className="p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {st.title}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                  {st.count}
                </div>
              </div>

              <div className={`p-3 rounded-2xl ${st.bg}`}>{st.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* 2. Achievements & Gamification Badges */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiZap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Milestones & Achievement Badges ({unlockedCount}/{achievements.length} Unlocked)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Badges unlocked through verified course completion, quiz mastery, and learning consistency.
            </p>
          </div>

          <Badge variant="primary" className="bg-amber-500/10 text-amber-600 font-extrabold">
            {learningStreakDays}-Day Active Streak
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {achievements.map((ach) => {
            const isUnlocked = ach.isUnlocked !== false;
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border text-center space-y-2 transition-all shadow-xs ${
                  isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className={`text-3xl font-black py-1 ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
                  {ach.icon}
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs line-clamp-1">
                  {ach.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                  {ach.description}
                </p>
                <div className="pt-1">
                  {isUnlocked ? (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
                      Unlocked {ach.earnedDate}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1">
                      <FiLock className="w-3 h-3" />
                      <span>{ach.requirement || 'Locked'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

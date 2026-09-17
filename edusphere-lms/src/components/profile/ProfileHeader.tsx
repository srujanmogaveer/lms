import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiArrowLeft,
  FiCalendar,
  FiZap,
  FiShield,
  FiAward,
  FiCreditCard,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../common/Avatar';
import type { FullStudentProfile } from '../../types';

interface ProfileHeaderProps {
  profile: FullStudentProfile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  activeTab,
  onSelectTab,
}) => {
  const navigate = useNavigate();

  const tabs = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'security', label: 'Account Security' },
    { id: 'achievements', label: 'Achievements & Stats' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back & Title Info */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student')}
            className="mt-1 flex items-center gap-1.5 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to Student Dashboard"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>

          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              email={profile.email}
              role="student"
              size="xl"
              shape="rounded"
              className="border-2 border-brand-500 shadow-md shrink-0"
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary" className="flex items-center gap-1">
                  <FiUser className="w-3.5 h-3.5" /> Student Profile & Settings
                </Badge>
                <span className="font-mono text-xs text-slate-500 font-bold">
                  ID: {profile.studentIdNumber}
                </span>
                <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                  <FiZap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                  {profile.learningStreakDays}-Day Streak
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {profile.fullName}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5 text-brand-600" /> Member since {profile.joinedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiShield className="w-3.5 h-3.5 text-emerald-500" /> Account Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/payments')}
            className="text-xs flex items-center gap-1.5 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold"
          >
            <FiCreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Payment History</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/certificates')}
            className="text-xs flex items-center gap-1.5 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <FiAward className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>My Certificates</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800 pt-4 scrollbar-none">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

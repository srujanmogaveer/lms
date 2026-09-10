import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen,
  FiFileText,
  FiVideo,
  FiAward,
  FiMessageSquare,
  FiVolume2,
} from 'react-icons/fi';
import { Button } from '../ui/Button';

export const QuickActionsNav: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { label: 'View Assignments', icon: <FiBookOpen className="w-4 h-4 text-amber-500" />, route: '/student/assignments' },
    { label: 'View Quizzes', icon: <FiFileText className="w-4 h-4 text-blue-500" />, route: '/student/quizzes' },
    { label: 'View Announcements', icon: <FiVolume2 className="w-4 h-4 text-rose-500" />, route: '/student/announcements' },
    { label: 'View Live Classes', icon: <FiVideo className="w-4 h-4 text-emerald-500" />, route: '/student/live' },
    { label: 'View Certificates', icon: <FiAward className="w-4 h-4 text-amber-600" />, route: '/student/certificates' },
    { label: 'View Discussion Forum', icon: <FiMessageSquare className="w-4 h-4 text-brand-500" />, route: '/student/forum' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Navigation Shortcuts
        </span>
        <span className="text-[11px] text-slate-400">Direct Module Links</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => (
          <Button
            key={act.route}
            variant="outline"
            size="sm"
            onClick={() => navigate(act.route)}
            className="w-full justify-start text-xs flex items-center gap-2 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {act.icon}
            <span className="truncate">{act.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

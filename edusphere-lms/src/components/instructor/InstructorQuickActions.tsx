import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPlusCircle,
  FiLayers,
  FiFolderPlus,
  FiFileText,
  FiCheckSquare,
  FiVideo,
  FiUsers,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface InstructorQuickActionsProps {
  onActionTrigger?: (actionId: string, actionTitle: string) => void;
}

export const InstructorQuickActions: React.FC<InstructorQuickActionsProps> = ({ onActionTrigger }) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'create_course',
      title: 'Create Course',
      description: 'Start a new course draft',
      icon: FiPlusCircle,
      to: '/instructor/courses',
      color: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-900',
    },
    {
      id: 'manage_curriculum',
      title: 'Manage Curriculum',
      description: 'Edit modules & lessons',
      icon: FiLayers,
      to: '/instructor/curriculum',
      color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
    },
    {
      id: 'upload_content',
      title: 'Upload Content',
      description: 'Add videos, PDFs & notes',
      icon: FiFolderPlus,
      to: '/instructor/content',
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    },
    {
      id: 'create_assignment',
      title: 'Create Assignment',
      description: 'Draft new student task',
      icon: FiFileText,
      to: '/instructor/assignments',
      color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    },
    {
      id: 'create_quiz',
      title: 'Create Quiz',
      description: 'Add assessment quiz',
      icon: FiCheckSquare,
      to: '/instructor/quizzes',
      color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    },
    {
      id: 'schedule_live',
      title: 'Schedule Live Class',
      description: 'Host IST studio session',
      icon: FiVideo,
      to: '/instructor/live',
      color: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900',
    },
    {
      id: 'view_students',
      title: 'View Students',
      description: 'Enrolled student roster',
      icon: FiUsers,
      to: '/instructor/students',
      color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    },
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    if (onActionTrigger) {
      onActionTrigger(action.id, action.title);
    } else {
      navigate(action.to);
    }
  };

  return (
    <Card className="p-6 space-y-4 shadow-md border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Quick Studio Actions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Launch tools for course creation, curriculum, assignments, and live streaming.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleActionClick(action)}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer group ${action.color}`}
              aria-label={action.title}
              title={action.description}
            >
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0 w-full">
                <p className="text-xs font-bold truncate">{action.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                  {action.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
};

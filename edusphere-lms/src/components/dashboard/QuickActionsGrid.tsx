import React from 'react';
import { motion } from 'framer-motion';
import {
  FiCompass,
  FiHeart,
  FiShoppingCart,
  FiBookOpen,
  FiFileText,
  FiHelpCircle,
  FiVideo,
  FiAward,
  FiZap,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface QuickActionsGridProps {
  onActionClick: (actionId: string, actionTitle: string) => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onActionClick }) => {
  const actions = [
    {
      id: 'browse_courses',
      title: 'Browse Courses',
      description: 'Explore 500+ topics',
      icon: FiCompass,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950/60 border-brand-100 dark:border-brand-900',
    },
    {
      id: 'wishlist',
      title: 'Wishlist',
      description: 'Saved for later',
      icon: FiHeart,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900',
    },
    {
      id: 'shopping_cart',
      title: 'Shopping Cart',
      description: 'Checkout pending',
      icon: FiShoppingCart,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900',
    },
    {
      id: 'my_courses',
      title: 'My Courses',
      description: 'Your enrollment list',
      icon: FiBookOpen,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      description: 'Submissions & grades',
      icon: FiFileText,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900',
    },
    {
      id: 'quizzes',
      title: 'Quizzes',
      description: 'Knowledge tests',
      icon: FiHelpCircle,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-100 dark:border-cyan-900',
    },
    {
      id: 'live_classes',
      title: 'Live Classes',
      description: 'Interactive workshops',
      icon: FiVideo,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900',
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'Earned credentials',
      icon: FiAward,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900',
    },
  ];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiZap className="w-5 h-5 text-amber-500 fill-amber-400/20" />
            Quick Navigation Actions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Direct shortcuts to key student workspace portals</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <motion.button
              key={act.id}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => onActionClick(act.id, act.title)}
              className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 transition-all shadow-sm ${act.bg}`}
            >
              <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm ${act.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                {act.title}
              </span>
              <span className="text-[10px] text-slate-400 line-clamp-1">{act.description}</span>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
};

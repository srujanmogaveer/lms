import React from 'react';
import { motion } from 'framer-motion';
import {
  FiFileText,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiAward,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface AssignmentStatsCardsProps {
  totalCount: number;
  pendingCount: number;
  submittedCount: number;
  gradedCount: number;
  averageScore: number;
  activeFilterStatus: string;
  onSelectStatusFilter: (status: string) => void;
}

export const AssignmentStatsCards: React.FC<AssignmentStatsCardsProps> = ({
  totalCount,
  pendingCount,
  submittedCount,
  gradedCount,
  averageScore,
  activeFilterStatus,
  onSelectStatusFilter,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Assignments',
      value: totalCount,
      subtext: 'Across all enrolled courses',
      icon: FiFileText,
      color: 'text-brand-600 dark:text-brand-400',
      bgColor: 'bg-brand-50 dark:bg-brand-950/60',
      borderColor: 'hover:border-brand-300 dark:hover:border-brand-800',
    },
    {
      id: 'pending',
      title: 'Pending Action',
      value: pendingCount,
      subtext: 'Awaiting submission',
      icon: FiClock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      borderColor: 'hover:border-amber-300 dark:hover:border-amber-800',
    },
    {
      id: 'submitted',
      title: 'Submitted',
      value: submittedCount,
      subtext: 'Under instructor review',
      icon: FiSend,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60',
      borderColor: 'hover:border-blue-300 dark:hover:border-blue-800',
    },
    {
      id: 'graded',
      title: 'Graded & Evaluated',
      value: gradedCount,
      subtext: 'Feedback published',
      icon: FiCheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderColor: 'hover:border-emerald-300 dark:hover:border-emerald-800',
    },
    {
      id: 'average',
      title: 'Average Grade',
      value: `${averageScore}%`,
      subtext: 'Cumulative score rating',
      icon: FiAward,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60',
      borderColor: 'hover:border-purple-300 dark:hover:border-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isActive = activeFilterStatus === card.id;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              hoverEffect
              onClick={() => card.id !== 'average' && onSelectStatusFilter(card.id)}
              className={`p-4 border flex flex-col justify-between transition-all cursor-pointer ${
                card.borderColor
              } ${
                isActive
                  ? 'ring-2 ring-brand-500 border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    {card.title}
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {card.value}
                  </div>
                </div>

                <div className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2 font-medium">
                {card.subtext}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

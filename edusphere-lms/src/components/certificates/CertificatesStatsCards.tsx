import React from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface CertificatesStatsCardsProps {
  totalCount: number;
  earnedCount: number;
  pendingCount: number;
  totalLearningHours: number;
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const CertificatesStatsCards: React.FC<CertificatesStatsCardsProps> = ({
  totalCount,
  earnedCount,
  pendingCount,
  totalLearningHours,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Credentials',
      count: totalCount,
      subtitle: 'Enrolled courses credentials',
      icon: <FiBookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      bgColor: 'bg-brand-50 dark:bg-brand-950/50',
      borderColor: 'border-brand-200 dark:border-brand-900',
      onClick: () => onSelectStatusFilter('all'),
      isActive: activeStatusFilter === 'all',
    },
    {
      id: 'earned',
      title: 'Earned Certificates',
      count: earnedCount,
      subtitle: '100% Unlocked & verified',
      icon: <FiAward className="w-5 h-5 text-amber-500 fill-amber-500" />,
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-200 dark:border-amber-900',
      onClick: () => onSelectStatusFilter('earned'),
      isActive: activeStatusFilter === 'earned',
    },
    {
      id: 'pending',
      title: 'Pending Requirements',
      count: pendingCount,
      subtitle: 'Incomplete lessons/quizzes',
      icon: <FiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200 dark:border-blue-900',
      onClick: () => onSelectStatusFilter('pending'),
      isActive: activeStatusFilter === 'pending',
    },
    {
      id: 'hours',
      title: 'Total Learning Hours',
      count: `${totalLearningHours} hrs`,
      subtitle: 'Cumulative study time',
      icon: <FiClock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      onClick: () => onSelectStatusFilter('all'),
      isActive: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          hoverEffect
          onClick={card.onClick}
          className={`p-5 cursor-pointer transition-all border ${
            card.isActive ? 'ring-2 ring-brand-500 shadow-md' : card.borderColor
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {card.count}
              </div>
              <span className="text-[11px] text-slate-400 block">{card.subtitle}</span>
            </div>

            <div className={`p-3 rounded-2xl ${card.bgColor}`}>{card.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

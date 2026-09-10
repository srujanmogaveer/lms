import React from 'react';
import {
  FiVideo,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface LiveClassesStatsCardsProps {
  totalCount: number;
  liveNowCount: number;
  todayCount: number;
  completedCount: number;
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const LiveClassesStatsCards: React.FC<LiveClassesStatsCardsProps> = ({
  totalCount,
  liveNowCount,
  todayCount,
  completedCount,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Scheduled',
      count: totalCount,
      subtitle: 'Enrolled live sessions',
      icon: <FiVideo className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      bgColor: 'bg-brand-50 dark:bg-brand-950/50',
      borderColor: 'border-brand-200 dark:border-brand-900',
      onClick: () => onSelectStatusFilter('all'),
      isActive: activeStatusFilter === 'all',
    },
    {
      id: 'live_now',
      title: 'Live Streaming Now',
      count: liveNowCount,
      subtitle: 'Active video rooms',
      icon: <FiVideo className="w-5 h-5 text-emerald-500 animate-pulse" />,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      onClick: () => onSelectStatusFilter('live_now'),
      isActive: activeStatusFilter === 'live_now',
    },
    {
      id: 'today',
      title: "Today's Schedule",
      count: todayCount,
      subtitle: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' sessions',
      icon: <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200 dark:border-blue-900',
      onClick: () => onSelectStatusFilter('upcoming'),
      isActive: false,
    },
    {
      id: 'completed',
      title: 'Completed Sessions',
      count: completedCount,
      subtitle: 'Recordings available',
      icon: <FiCheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      borderColor: 'border-purple-200 dark:border-purple-900',
      onClick: () => onSelectStatusFilter('completed'),
      isActive: activeStatusFilter === 'completed',
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

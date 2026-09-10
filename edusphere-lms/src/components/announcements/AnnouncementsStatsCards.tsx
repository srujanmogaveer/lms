import React from 'react';
import {
  FiBell,
  FiBookOpen,
  FiServer,
  FiMail,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface AnnouncementsStatsCardsProps {
  totalCount: number;
  courseCount: number;
  systemCount: number;
  unreadCount: number;
  activeFilterType: string;
  onSelectTypeFilter: (type: string) => void;
  onSelectUnreadFilter: () => void;
}

export const AnnouncementsStatsCards: React.FC<AnnouncementsStatsCardsProps> = ({
  totalCount,
  courseCount,
  systemCount,
  unreadCount,
  activeFilterType,
  onSelectTypeFilter,
  onSelectUnreadFilter,
}) => {
  const cards = [
    {
      id: 'total',
      title: 'Total Announcements',
      count: totalCount,
      subtitle: 'Published platform wide',
      icon: <FiBell className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      bgColor: 'bg-brand-50 dark:bg-brand-950/50',
      borderColor: 'border-brand-200 dark:border-brand-900',
      onClick: () => onSelectTypeFilter('all'),
      isActive: activeFilterType === 'all',
    },
    {
      id: 'course',
      title: 'Course Updates',
      count: courseCount,
      subtitle: 'Enrolled subjects news',
      icon: <FiBookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      borderColor: 'border-purple-200 dark:border-purple-900',
      onClick: () => onSelectTypeFilter('course_update'),
      isActive: activeFilterType === 'course_update',
    },
    {
      id: 'system',
      title: 'System Notices',
      count: systemCount,
      subtitle: 'Platform & maintenance',
      icon: <FiServer className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200 dark:border-blue-900',
      onClick: () => onSelectTypeFilter('system_maintenance'),
      isActive: activeFilterType === 'system_maintenance',
    },
    {
      id: 'unread',
      title: 'Unread Items',
      count: unreadCount,
      subtitle: 'Requires student attention',
      icon: <FiMail className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-200 dark:border-amber-900',
      onClick: onSelectUnreadFilter,
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

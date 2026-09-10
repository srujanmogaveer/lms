import React from 'react';
import {
  FiBell,
  FiAlertCircle,
  FiCalendar,
} from 'react-icons/fi';
import { Card } from '../ui/Card';

interface NotificationsStatsCardsProps {
  totalCount: number;
  unreadCount: number;
  importantCount: number;
  todayCount: number;
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const NotificationsStatsCards: React.FC<NotificationsStatsCardsProps> = ({
  totalCount,
  unreadCount,
  importantCount,
  todayCount,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Alerts',
      count: totalCount,
      subtitle: 'All system notifications',
      icon: <FiBell className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
      bgColor: 'bg-brand-50 dark:bg-brand-950/50',
      borderColor: 'border-brand-200 dark:border-brand-900',
      onClick: () => onSelectStatusFilter('all'),
      isActive: activeStatusFilter === 'all',
    },
    {
      id: 'unread',
      title: 'Unread Alerts',
      count: unreadCount,
      subtitle: 'Requires student review',
      icon: <FiBell className="w-5 h-5 text-brand-500 animate-pulse" />,
      bgColor: 'bg-brand-50 dark:bg-brand-950/50',
      borderColor: 'border-brand-200 dark:border-brand-900',
      onClick: () => onSelectStatusFilter('unread'),
      isActive: activeStatusFilter === 'unread',
    },
    {
      id: 'important',
      title: 'Important / Urgent',
      count: importantCount,
      subtitle: 'High priority deadlines',
      icon: <FiAlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bgColor: 'bg-rose-50 dark:bg-rose-950/50',
      borderColor: 'border-rose-200 dark:border-rose-900',
      onClick: () => onSelectStatusFilter('important'),
      isActive: activeStatusFilter === 'important',
    },
    {
      id: 'today',
      title: "Today's Broadcasts",
      count: todayCount,
      subtitle: 'Received August 3, 2026',
      icon: <FiCalendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
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

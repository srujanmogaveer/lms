import React from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiCheckCircle, FiInfo, FiAlertCircle, FiAward, FiCreditCard } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Notification } from '../../types';

interface RecentNotificationsSectionProps {
  notifications: Notification[];
  onViewAllNotifications: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export const RecentNotificationsSection: React.FC<RecentNotificationsSectionProps> = ({
  notifications,
  onViewAllNotifications,
  onNotificationClick,
}) => {
  const getIcon = (type: string, title: string) => {
    if (title.includes('Certificate')) return <FiAward className="w-4 h-4 text-purple-600" />;
    if (title.includes('Payment')) return <FiCreditCard className="w-4 h-4 text-emerald-600" />;
    if (type === 'warning') return <FiAlertCircle className="w-4 h-4 text-amber-600" />;
    if (type === 'success') return <FiCheckCircle className="w-4 h-4 text-emerald-600" />;
    return <FiInfo className="w-4 h-4 text-brand-600" />;
  };

  const getBg = (type: string) => {
    if (type === 'warning') return 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900';
    if (type === 'success') return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900';
    return 'bg-brand-50 dark:bg-brand-950/40 border-brand-100 dark:border-brand-900';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiBell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Recent Notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Updates across assignments, quizzes & payments</p>
        </div>

        <Button size="sm" variant="ghost" onClick={onViewAllNotifications}>
          View All ({notifications.length})
        </Button>
      </div>

      <div className="space-y-2.5">
        {notifications.slice(0, 5).map((notif, idx) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            onClick={() => onNotificationClick(notif)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              notif.read ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800' : getBg(notif.type)
            }`}
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm shrink-0 mt-0.5">
              {getIcon(notif.type, notif.title)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {notif.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">{notif.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                {notif.message}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

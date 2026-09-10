import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiCheckCircle, FiFileText, FiUserCheck, FiStar } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { notificationService } from '../../services/notificationService';
import type { NotificationItem } from '../../types';

export const InstructorNotificationsWidget: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications(10);
      setNotifications(res.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case 'assignment':
        return <FiFileText className="w-4 h-4 text-rose-500" />;
      case 'enrollment':
        return <FiUserCheck className="w-4 h-4 text-brand-500" />;
      case 'review':
        return <FiStar className="w-4 h-4 text-amber-500 fill-amber-400" />;
      case 'quiz':
        return <FiCheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <FiBell className="w-4 h-4 text-indigo-500" />;
    }
  };

  const hasUnread = notifications.some((n) => !n.read && !n.isRead);

  return (
    <Card className="p-6 space-y-4 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-950 text-brand-600 rounded-xl relative">
              <FiBell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Latest Notifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time activity alerts across your courses.
              </p>
            </div>
          </div>

          {hasUnread && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
            >
              Mark All Read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No notifications</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              You will receive real-time notifications when students enroll, submit assignments, or request reattempts.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((n) => {
              const isUnread = !n.read && !n.isRead;
              return (
                <motion.div
                  key={n.id}
                  whileHover={{ x: 2 }}
                  className={`p-3 rounded-2xl border flex items-start gap-3 transition-all ${
                    !isUnread
                      ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800'
                      : 'bg-brand-50/30 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs shrink-0 mt-0.5">
                    {getNotifIcon(n.type)}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

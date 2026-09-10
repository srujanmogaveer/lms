import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiArrowLeft,
  FiRefreshCw,
  FiCheckCircle,
  FiTrash2,
  FiSliders,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface NotificationsHeaderProps {
  totalCount: number;
  unreadCount: number;
  readCount: number;
  importantCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onOpenPreferences: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  totalCount,
  unreadCount,
  readCount,
  importantCount,
  onMarkAllAsRead,
  onClearAll,
  onOpenPreferences,
  onRefresh,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back & Title */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student')}
            className="mt-1 flex items-center gap-1.5 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to Student Dashboard"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" className="flex items-center gap-1">
                <FiBell className="w-3.5 h-3.5 text-brand-600 animate-bounce" /> Central Notification Center
              </Badge>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                <span>{totalCount} Total Alerts</span>
                <span>•</span>
                {unreadCount > 0 ? (
                  <span className="text-brand-600 font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">0 Unread</span>
                )}
                <span>•</span>
                <span className="text-slate-500">{readCount} Read</span>
                <span>•</span>
                <span className="text-rose-600 font-semibold">{importantCount} Important</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Activity Alerts & Notifications
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stay updated on upcoming assignment deadlines, quiz scores, live virtual classes, and course certificates.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs flex items-center gap-1.5 disabled:opacity-50"
            title="Mark All Notifications as Read"
          >
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All Read</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-xs flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Clear All Notifications"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPreferences}
            className="text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
            title="Configure Alert Channels"
          >
            <FiSliders className="w-3.5 h-3.5 text-brand-600" />
            <span>Preferences</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5"
            title="Refresh Feed"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

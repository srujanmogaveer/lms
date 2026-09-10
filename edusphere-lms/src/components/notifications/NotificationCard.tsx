import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiBookOpen,
  FiFileText,
  FiVideo,
  FiAward,
  FiCreditCard,
  FiAlertCircle,
  FiMessageSquare,
  FiCheck,
  FiEye,
  FiExternalLink,
  FiTrash2,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { StudentNotificationItem } from '../../types';

interface NotificationCardProps {
  notification: StudentNotificationItem;
  onOpenDetails: (notification: StudentNotificationItem) => void;
  onToggleRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onOpenDetails,
  onToggleRead,
  onDelete,
}) => {
  const navigate = useNavigate();

  const {
    id,
    title,
    message,
    category,
    timestamp,
    read,
    isImportant,
    courseTitle,
    actionUrl,
    actionLabel,
  } = notification;

  const getCategoryIcon = () => {
    switch (category) {
      case 'assignment':
        return <FiBookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'quiz':
        return <FiFileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'live_class':
        return <FiVideo className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'certificate':
        return <FiAward className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'payment':
        return <FiCreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'instructor_message':
        return <FiMessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
      default:
        return <FiBell className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
    }
  };

  const getCategoryBg = () => {
    switch (category) {
      case 'assignment':
        return 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900';
      case 'quiz':
        return 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900';
      case 'live_class':
        return 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900';
      case 'certificate':
        return 'bg-amber-100/60 dark:bg-amber-950/60 border-amber-300 dark:border-amber-900';
      case 'payment':
        return 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <Card
      hoverEffect
      className={`p-5 border transition-all space-y-3 ${
        !read
          ? 'bg-brand-50/30 dark:bg-brand-950/20 border-brand-300 dark:border-brand-900/60 shadow-xs ring-1 ring-brand-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Category Icon Badge & Header */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-2xl border shrink-0 ${getCategoryBg()}`}>
            {getCategoryIcon()}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {!read && (
                <Badge variant="primary" className="flex items-center gap-1 bg-brand-600 text-white font-extrabold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> UNREAD
                </Badge>
              )}
              {isImportant && (
                <Badge variant="danger" className="flex items-center gap-1 text-[10px] font-bold">
                  <FiAlertCircle className="w-3 h-3" /> IMPORTANT
                </Badge>
              )}
              {courseTitle && (
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 truncate">
                  {courseTitle}
                </span>
              )}
            </div>

            <h3
              onClick={() => onOpenDetails(notification)}
              className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1 hover:text-brand-600 transition-colors cursor-pointer"
            >
              {title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[11px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
          {timestamp}
        </span>
      </div>

      {/* Footer Action Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <button
          type="button"
          onClick={() => onToggleRead(id)}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <FiCheck className={`w-3.5 h-3.5 ${read ? 'text-emerald-600' : ''}`} />
          <span>{read ? 'Mark as Unread' : 'Mark as Read'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-colors text-xs"
              title="Delete Notification"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDetails(notification)}
            className="text-xs flex items-center gap-1"
          >
            <FiEye className="w-3.5 h-3.5" />
            <span>Details</span>
          </Button>

          {actionUrl && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!read) onToggleRead(id);
                navigate(actionUrl);
              }}
              className="text-xs flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs"
            >
              <span>
                {actionLabel ||
                  (category === 'announcement'
                    ? 'View Announcement'
                    : category === 'assignment'
                    ? 'Open Assignment'
                    : category === 'quiz'
                    ? 'View Quiz'
                    : category === 'live_class'
                    ? 'Join Room'
                    : category === 'certificate'
                    ? 'View Certificate'
                    : 'Open Details')}
              </span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheck,
  FiExternalLink,
  FiAlertCircle,
  FiTrash2,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentNotificationItem } from '../../types';

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: StudentNotificationItem | null;
  onToggleRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
  isOpen,
  onClose,
  notification,
  onToggleRead,
  onDelete,
}) => {
  const navigate = useNavigate();

  if (!notification) return null;

  const {
    id,
    title,
    message,
    category,
    timestamp,
    date,
    read,
    isImportant,
    courseTitle,
    actionUrl,
    actionLabel,
  } = notification;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Alert Details"
    >
      <div className="space-y-6 py-2">
        {/* Header Box */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/60 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {category.replace('_', ' ')}
            </span>

            <div className="flex items-center gap-2">
              {!read && (
                <Badge variant="primary" className="bg-brand-600 text-white font-extrabold">
                  UNREAD
                </Badge>
              )}
              {isImportant && (
                <Badge variant="danger" className="flex items-center gap-1">
                  <FiAlertCircle className="w-3.5 h-3.5" /> IMPORTANT
                </Badge>
              )}
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Related Course</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {courseTitle || 'General System Broadcast'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Timestamp</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {date} ({timestamp})
              </span>
            </div>
          </div>
        </div>

        {/* Message Body */}
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            Notification Message Body
          </span>
          <p className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 leading-relaxed text-sm">
            {message}
          </p>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => onToggleRead(id)}
              className="text-xs flex items-center gap-1.5"
            >
              <FiCheck className={`w-4 h-4 ${read ? 'text-emerald-600' : ''}`} />
              <span>{read ? 'Mark as Unread' : 'Mark as Read'}</span>
            </Button>

            {onDelete && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onDelete(id);
                  onClose();
                }}
                className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900 flex items-center gap-1"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>

          {actionUrl && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!read) onToggleRead(id);
                onClose();
                navigate(actionUrl);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 text-xs font-bold shadow-sm"
            >
              <span>{actionLabel || 'Go to Associated Page'}</span>
              <FiExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

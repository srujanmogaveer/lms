import React from 'react';
import {
  FiPaperclip,
  FiDownload,
  FiShare2,
  FiCheckCircle,
  FiMail,
  FiAlertCircle,
  FiEye,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { StudentAnnouncement } from '../../types';

interface AnnouncementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: StudentAnnouncement | null;
  onToggleRead: (id: string) => void;
}

export const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({
  isOpen,
  onClose,
  announcement,
  onToggleRead,
}) => {
  if (!announcement) return null;

  const {
    id,
    title,
    content,
    message,
    authorName,
    authorAvatar,
    authorRole,
    courseTitle,
    date,
    isImportant,
    isRead,
    attachments,
  } = announcement;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Announcement Notice Details"
    >
      <div className="space-y-6 py-2">
        {/* Header Bar */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/60 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {courseTitle || 'System Announcement'}
            </span>

            <div className="flex items-center gap-2">
              {isImportant && (
                <Badge variant="danger" className="flex items-center gap-1">
                  <FiAlertCircle className="w-3.5 h-3.5" /> High Priority Notice
                </Badge>
              )}
              {isRead ? (
                <Badge variant="success">Read</Badge>
              ) : (
                <Badge variant="warning">Unread</Badge>
              )}
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </h2>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-6 h-6 rounded-full object-cover border border-slate-300 dark:border-slate-600"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {authorName} ({authorRole})
              </span>
            </div>

            <span className="font-mono">{date}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 max-h-80 overflow-y-auto custom-scrollbar p-1">
          {(content || message || '').split('\n\n').map((paragraph: string, idx: number) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Attachments Section */}
        {attachments && attachments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Announcement Attachments ({attachments.length})
            </span>

            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiPaperclip className="w-4 h-4 text-brand-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold block text-slate-900 dark:text-slate-100 truncate">
                        {att.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{att.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Previewing ${att.name}`)}
                      className="text-xs flex items-center gap-1 py-1"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => alert(`Downloading ${att.name}`)}
                      className="text-xs flex items-center gap-1 bg-brand-600 text-white py-1"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="md"
            onClick={() => onToggleRead(id)}
            className="text-xs flex items-center gap-1.5"
          >
            {isRead ? (
              <>
                <FiMail className="w-4 h-4 text-amber-600" />
                <span>Mark as Unread</span>
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Mark as Read</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => alert(`Share announcement link: edusphere.com/announcements/${id}`)}
              className="text-xs flex items-center gap-1.5"
            >
              <FiShare2 className="w-4 h-4" />
              <span>Share</span>
            </Button>

            <Button variant="primary" size="md" onClick={onClose} className="bg-brand-600 text-white text-xs">
              Close Notice
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

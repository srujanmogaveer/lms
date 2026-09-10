import React from 'react';
import {
  FiStar,
  FiAlertCircle,
  FiPaperclip,
  FiChevronRight,
  FiMail,
  FiCheckCircle,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { StudentAnnouncement } from '../../types';

interface AnnouncementCardProps {
  announcement: StudentAnnouncement;
  onOpenDetails: (announcement: StudentAnnouncement) => void;
  onToggleRead: (id: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onOpenDetails,
  onToggleRead,
}) => {
  const {
    id,
    title,
    summary,
    authorName,
    authorAvatar,
    authorRole,
    courseTitle,
    type,
    date,
    isImportant,
    isPinned,
    isNew,
    isRead,
    attachments,
  } = announcement;

  const getTypeBadge = () => {
    switch (type) {
      case 'system_maintenance':
        return <Badge variant="primary" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">System Notice</Badge>;
      case 'exam_schedule':
        return <Badge variant="warning" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Exam Schedule</Badge>;
      case 'course_update':
        return <Badge variant="primary">Course Update</Badge>;
      default:
        return <Badge variant="neutral">General</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'system':
        return (
          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.2 rounded-full uppercase">
            EduSphere Admin
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.2 rounded-full">
            Instructor
          </span>
        );
    }
  };

  return (
    <Card
      hoverEffect
      className={`flex flex-col justify-between h-full space-y-4 p-5 border transition-all ${
        !isRead
          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-xs'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getTypeBadge()}
            {isImportant && (
              <Badge variant="danger" className="flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> Important
              </Badge>
            )}
            {isPinned && (
              <Badge variant="warning" className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <FiStar className="w-3 h-3 fill-amber-500" /> Pinned
              </Badge>
            )}
            {isNew && <Badge variant="success">New</Badge>}
          </div>

          <button
            onClick={() => onToggleRead(id)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isRead
                ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                : 'border-amber-300 dark:border-amber-700 text-amber-600 bg-amber-50 dark:bg-amber-950'
            }`}
            title={isRead ? 'Mark as Unread' : 'Mark as Read'}
          >
            {isRead ? <FiCheckCircle className="w-4 h-4 text-emerald-600" /> : <FiMail className="w-4 h-4 text-amber-600" />}
          </button>
        </div>

        {/* Announcement Title */}
        <h3
          onClick={() => onOpenDetails(announcement)}
          className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer leading-snug"
        >
          {title}
        </h3>

        {/* Channel / Course Name */}
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 line-clamp-1">
          {courseTitle || 'System Announcement'}
        </p>

        {/* Summary Snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {summary}
        </p>

        {/* Author Footer */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
              {authorName}
            </span>
            {getRoleBadge(authorRole || 'instructor')}
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {date}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          {attachments && attachments.length > 0 ? (
            <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
              <FiPaperclip className="w-3.5 h-3.5" />
              <span>{attachments.length} Attachments</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No attachments</span>
          )}

          <span className="font-mono text-[11px]">
            {isRead ? 'Status: Read' : 'Status: Unread'}
          </span>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => onOpenDetails(announcement)}
          className="w-full justify-center text-xs flex items-center gap-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 hover:border-brand-300"
        >
          <span>Read Complete Announcement</span>
          <FiChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

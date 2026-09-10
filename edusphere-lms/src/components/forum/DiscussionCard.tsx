import React from 'react';
import {
  FiMessageSquare,
  FiThumbsUp,
  FiEye,
  FiCheckCircle,
  FiChevronRight,
  FiStar,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { StudentForumDiscussion } from '../../types';

interface DiscussionCardProps {
  discussion: StudentForumDiscussion;
  onOpenDetails: (discussion: StudentForumDiscussion) => void;
  onToggleLike: (discussionId: string) => void;
}

export const DiscussionCard: React.FC<DiscussionCardProps> = ({
  discussion,
  onOpenDetails,
  onToggleLike,
}) => {
  const {
    id,
    title,
    courseTitle,
    category,
    content,
    authorName,
    authorAvatar,
    authorRole,
    createdAt,
    repliesCount,
    viewsCount,
    likesCount,
    isLiked,
    isPinned,
    isSolved,
  } = discussion;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'instructor':
        return (
          <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.2 rounded-full uppercase">
            Instructor
          </span>
        );
      case 'ta':
        return (
          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.2 rounded-full uppercase">
            Teaching Assistant
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.2 rounded-full">
            Student
          </span>
        );
    }
  };

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full space-y-4 p-5 border border-slate-200 dark:border-slate-800">
      <div className="space-y-3">
        {/* Category & Status Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="primary">{category}</Badge>
            {isPinned && (
              <Badge variant="warning" className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <FiStar className="w-3 h-3 fill-amber-500" /> Pinned
              </Badge>
            )}
          </div>

          <div>
            {isSolved ? (
              <Badge variant="success" className="flex items-center gap-1">
                <FiCheckCircle className="w-3.5 h-3.5" /> Solved
              </Badge>
            ) : repliesCount === 0 ? (
              <Badge variant="neutral" className="text-slate-500">
                Unanswered
              </Badge>
            ) : (
              <Badge variant="neutral" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Active Thread
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetails(discussion)}
          className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer leading-snug"
        >
          {title}
        </h3>

        {/* Course Title */}
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 line-clamp-1">
          {courseTitle}
        </p>

        {/* Content Snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {content}
        </p>

        {/* Author Details */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
              {authorName}
            </span>
            {getRoleBadge(authorRole)}
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {createdAt}
          </span>
        </div>
      </div>

      {/* Footer Metrics & Action Button */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FiMessageSquare className="w-3.5 h-3.5 text-brand-500" />
              <span>{repliesCount} Replies</span>
            </span>

            <span className="flex items-center gap-1">
              <FiEye className="w-3.5 h-3.5 text-slate-400" />
              <span>{viewsCount} Views</span>
            </span>
          </div>

          <button
            onClick={() => onToggleLike(id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              isLiked
                ? 'bg-brand-50 dark:bg-brand-950 border-brand-300 text-brand-600 dark:text-brand-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-brand-600' : ''}`} />
            <span>{likesCount}</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => onOpenDetails(discussion)}
          className="w-full justify-center text-xs flex items-center gap-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 hover:border-brand-300"
        >
          <span>View Discussion & Replies</span>
          <FiChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

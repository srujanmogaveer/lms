import React, { useState } from 'react';
import {
  FiArrowLeft,
  FiThumbsUp,
  FiMessageSquare,
  FiCheckCircle,
  FiPaperclip,
  FiSend,
  FiDownload,
  FiFlag,
  FiBold,
  FiItalic,
  FiCode,
  FiStar,
  FiLock,
  FiTrash2,
  FiEdit,
  FiCheck,
} from 'react-icons/fi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BaseModal } from '../dashboard/DashboardModals';
import type { StudentForumDiscussion, ForumReply } from '../../types';

interface DiscussionDetailWorkspaceProps {
  discussion: StudentForumDiscussion;
  currentUserId?: string;
  currentUserRole?: 'student' | 'instructor' | 'admin';
  onBackToList: () => void;
  onAddReply: (discussionId: string, replyContent: string) => Promise<void> | void;
  onToggleLikeDiscussion: (discussionId: string) => void;
  onToggleLikeReply: (replyId: string) => void;
  onModerateDiscussion?: (discussionId: string, data: { isPinned?: boolean; isSolved?: boolean; isLocked?: boolean }) => void;
  onModerateReply?: (replyId: string, data: { isPinned?: boolean; isAcceptedAnswer?: boolean }) => void;
  onDeleteReply?: (replyId: string) => void;
  onUpdateReply?: (replyId: string, content: string) => void;
  onReport?: (targetType: 'discussion' | 'reply', targetId: string, reason: string) => void;
}

export const DiscussionDetailWorkspace: React.FC<DiscussionDetailWorkspaceProps> = ({
  discussion,
  currentUserId,
  currentUserRole = 'student',
  onBackToList,
  onAddReply,
  onToggleLikeDiscussion,
  onToggleLikeReply,
  onModerateDiscussion,
  onModerateReply,
  onDeleteReply,
  onUpdateReply,
  onReport,
}) => {
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Edit reply state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'discussion' | 'reply'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');

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
    viewsCount,
    likesCount,
    isLiked,
    isSolved,
    isPinned,
    isLocked,
    attachments,
    replies,
  } = discussion;

  const isInstructorOrAdmin = currentUserRole === 'instructor' || currentUserRole === 'admin';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'instructor':
        return (
          <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2.5 py-0.5 rounded-full uppercase">
            Instructor
          </span>
        );
      case 'admin':
        return (
          <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-0.5 rounded-full uppercase">
            Admin
          </span>
        );
      case 'ta':
        return (
          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-full uppercase">
            TA
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-0.5 rounded-full">
            Student
          </span>
        );
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyContent.trim() || isLocked) return;

    setIsSubmittingReply(true);
    try {
      await onAddReply(id, newReplyContent.trim());
      setNewReplyContent('');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleOpenReport = (type: 'discussion' | 'reply', targetId: string) => {
    setReportTarget({ type, id: targetId });
    setReportReason('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    if (onReport) {
      onReport(reportTarget.type, reportTarget.id, reportReason.trim());
    }
    setReportModalOpen(false);
    setReportTarget(null);
    setReportReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToList}
          className="flex items-center gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Forum Threads</span>
        </Button>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Moderation Controls for Instructor / Admin */}
          {isInstructorOrAdmin && onModerateDiscussion && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onModerateDiscussion(id, { isPinned: !isPinned })}
                className={`flex items-center gap-1.5 text-xs ${
                  isPinned ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300' : ''
                }`}
              >
                <FiStar className="w-3.5 h-3.5" />
                <span>{isPinned ? 'Unpin' : 'Pin Thread'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onModerateDiscussion(id, { isSolved: !isSolved })}
                className={`flex items-center gap-1.5 text-xs ${
                  isSolved ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-300' : ''
                }`}
              >
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>{isSolved ? 'Mark Open' : 'Mark Solved'}</span>
              </Button>
            </>
          )}

        </div>
      </div>

      {/* Locked Thread Alert */}
      {isLocked && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs font-semibold">
          <FiLock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>This discussion thread has been locked by a moderator. New replies cannot be posted.</span>
        </div>
      )}

      {/* Main Question Post Canvas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
        {/* Category & Status Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary">{category}</Badge>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {courseTitle}
            </span>
            {isPinned && (
              <Badge variant="warning" className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <FiStar className="w-3 h-3 fill-amber-500" /> Pinned Thread
              </Badge>
            )}
          </div>

          {isSolved && (
            <Badge variant="success" className="flex items-center gap-1">
              <FiCheckCircle className="w-3.5 h-3.5" /> Solved Problem
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
          {title}
        </h1>

        {/* Author Header */}
        <div className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {authorName}
                </span>
                {getRoleBadge(authorRole)}
              </div>
              <span className="text-[11px] text-slate-400">Posted {createdAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
            <span>{viewsCount} Views</span>
            <span>•</span>
            <span>{replies.length} Replies</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 pt-2 whitespace-pre-line">
          <p>{content}</p>
        </div>

        {/* Attachments Section */}
        {attachments && attachments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Thread Attachments
            </span>
            <div className="flex flex-wrap gap-3">
              {attachments.map((att: any) => (
                <div
                  key={att.id || att.name}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs"
                >
                  <FiPaperclip className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-slate-100 line-clamp-1">
                      {att.fileName || att.name}
                    </span>
                    <span className="text-[11px] text-slate-400">{att.fileSize || att.size}</span>
                  </div>
                  {att.fileUrl && att.fileUrl !== '#' && (
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-xs ml-2 text-brand-600 hover:text-brand-700"
                      aria-label="Download attachment"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Like Footer Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => onToggleLikeDiscussion(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold transition-all ${
              isLiked
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 border-brand-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
            <span>{isLiked ? 'Liked' : 'Like Post'} ({likesCount})</span>
          </button>

          <span className="text-slate-400 font-mono text-[11px]">
            Discussion ID: {id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Replies Stream Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
            <FiMessageSquare className="w-5 h-5 text-brand-600" />
            <span>Community Replies ({replies.length})</span>
          </h3>
        </div>

        {/* List of Replies */}
        <div className="space-y-4">
          {replies.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No replies yet. Be the first to share an answer or solution!
            </div>
          ) : (
            replies.map((reply: ForumReply) => {
              const isEditingThis = editingReplyId === reply.id;
              const isAuthorOrAdmin = reply.authorId === currentUserId || isInstructorOrAdmin;

              return (
                <div
                  key={reply.id}
                  className={`p-5 rounded-2xl border space-y-3 transition-all ${
                    reply.isAcceptedAnswer
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 shadow-sm'
                      : reply.isPinnedReply
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Accepted / Pinned Reply Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {reply.isAcceptedAnswer && (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                        <span>Accepted Best Answer by Instructor</span>
                      </div>
                    )}
                    {reply.isPinnedReply && (
                      <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold text-xs">
                        <FiStar className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Pinned Reply</span>
                      </div>
                    )}
                  </div>

                  {/* Reply Author Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={reply.authorAvatar}
                        alt={reply.authorName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {reply.authorName}
                          </span>
                          {getRoleBadge(reply.authorRole)}
                        </div>
                        <span className="text-[11px] text-slate-400">{reply.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Instructor Moderation Actions for Reply */}
                      {isInstructorOrAdmin && onModerateReply && (
                        <>
                          <button
                            onClick={() =>
                              onModerateReply(reply.id, {
                                isAcceptedAnswer: !reply.isAcceptedAnswer,
                              })
                            }
                            className={`p-1.5 rounded-lg border text-xs ${
                              reply.isAcceptedAnswer
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'text-slate-400 hover:text-emerald-600 border-slate-200 dark:border-slate-700'
                            }`}
                            title={reply.isAcceptedAnswer ? 'Remove Accepted' : 'Accept Answer'}
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              onModerateReply(reply.id, {
                                isPinned: !reply.isPinnedReply,
                              })
                            }
                            className={`p-1.5 rounded-lg border text-xs ${
                              reply.isPinnedReply
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'text-slate-400 hover:text-amber-600 border-slate-200 dark:border-slate-700'
                            }`}
                            title={reply.isPinnedReply ? 'Unpin Reply' : 'Pin Reply'}
                          >
                            <FiStar className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Edit / Delete for Author or Admin */}
                      {isAuthorOrAdmin && onUpdateReply && !isEditingThis && (
                        <button
                          onClick={() => {
                            setEditingReplyId(reply.id);
                            setEditReplyText(reply.content);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Reply"
                        >
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAuthorOrAdmin && onDeleteReply && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this reply?')) {
                              onDeleteReply(reply.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Reply"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Like button */}
                      <button
                        onClick={() => onToggleLikeReply(reply.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                          reply.isLiked
                            ? 'bg-brand-50 dark:bg-brand-950 border-brand-300 text-brand-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <FiThumbsUp className="w-3.5 h-3.5" />
                        <span>{reply.likesCount}</span>
                      </button>

                      {/* Report button */}
                      <button
                        onClick={() => handleOpenReport('reply', reply.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Report Reply"
                      >
                        <FiFlag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reply Body Content / Editor */}
                  {isEditingThis ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingReplyId(null);
                            setEditReplyText('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (editReplyText.trim() && onUpdateReply) {
                              onUpdateReply(reply.id, editReplyText.trim());
                              setEditingReplyId(null);
                              setEditReplyText('');
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-1 whitespace-pre-line">
                      {reply.content}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Reply Editor Canvas */}
        {!isLocked && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FiMessageSquare className="w-4 h-4 text-brand-600" />
              <span>Write a Reply</span>
            </h4>

            <form onSubmit={handleReplySubmit} className="space-y-3">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                {/* Toolbar */}
                <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 bg-white dark:bg-slate-900 text-xs">
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100"
                    title="Bold"
                  >
                    <FiBold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100"
                    title="Italic"
                  >
                    <FiItalic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100"
                    title="Code Block"
                  >
                    <FiCode className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  required
                  value={newReplyContent}
                  onChange={(e) => setNewReplyContent(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or code solutions..."
                  className="w-full h-24 p-3 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={!newReplyContent.trim() || isSubmittingReply}
                  className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 text-xs"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>{isSubmittingReply ? 'Posting...' : 'Submit Reply'}</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Moderation Report Modal */}
      <BaseModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Content for Moderation"
      >
        <form onSubmit={handleSubmitReport} className="space-y-4 py-2 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Please let our instructors and moderators know why this content is inappropriate or violates community guidelines.
          </p>

          <div className="space-y-1">
            <label className="font-bold text-slate-900 dark:text-slate-100 block">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Inappropriate language, off-topic spam, or incorrect harmful advice..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!reportReason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
};

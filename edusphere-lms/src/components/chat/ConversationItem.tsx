import React from 'react';
import type { ChatConversation } from '../../types';

interface ConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const name =
    conversation.participant?.name ||
    conversation.instructorName ||
    'Unknown';
  const avatar =
    conversation.participant?.avatar ||
    conversation.instructorAvatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const lastMsg = conversation.lastMessage || '';
  const time = conversation.lastMessageTime || '';
  const unread = conversation.unreadCount ?? 0;
  const role = conversation.participant?.role ?? conversation.type ?? '';

  const roleLabel =
    role === 'admin'
      ? 'Admin'
      : role === 'instructor'
      ? 'Instructor'
      : role === 'student'
      ? 'Student'
      : '';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
        isActive
          ? 'bg-brand-50 dark:bg-brand-950/40 ring-1 ring-brand-200 dark:ring-brand-800'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
          }}
        />
        {/* Online dot */}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-sm font-semibold truncate ${
              isActive
                ? 'text-brand-700 dark:text-brand-300'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {name}
          </span>
          {time && (
            <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {roleLabel && (
              <span className="font-medium text-brand-600 dark:text-brand-400 mr-1">
                {roleLabel}
              </span>
            )}
            {lastMsg || 'Start a conversation'}
          </p>
          {unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

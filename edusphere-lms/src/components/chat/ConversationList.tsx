import React, { useState } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import type { ChatConversation } from '../../types';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (conv: ChatConversation) => void;
  onNewChat: () => void;
  /** On mobile, whether the panel is visible */
  isMobileVisible?: boolean;
  onMobileClose?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  isMobileVisible,
  onMobileClose,
}) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) => {
    const name =
      c.participant?.name ?? c.instructorName ?? '';
    const last = c.lastMessage ?? '';
    const q = search.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      last.toLowerCase().includes(q)
    );
  });

  const panel = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Messages
          </h2>
          <button
            onClick={onNewChat}
            title="New conversation"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 border border-transparent focus:outline-none focus:border-brand-400 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
            <p className="text-xs text-slate-400">
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </p>
            {!search && (
              <button
                onClick={onNewChat}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                Start one now →
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => {
                onSelect(conv);
                onMobileClose?.();
              }}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex flex-col w-72 shrink-0 h-full">
        {panel}
      </div>

      {/* Mobile: overlay drawer */}
      {isMobileVisible && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in-left">
            {panel}
          </div>
        </div>
      )}
    </>
  );
};

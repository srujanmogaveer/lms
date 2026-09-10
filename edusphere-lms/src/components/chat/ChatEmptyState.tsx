import React from 'react';
import { FiMessageCircle } from 'react-icons/fi';

interface ChatEmptyStateProps {
  onNewChat?: () => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onNewChat }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-slate-50/60 dark:bg-slate-950/30">
    <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center text-brand-500 dark:text-brand-400 shadow-sm">
      <FiMessageCircle className="w-8 h-8" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
        No conversation selected
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
        Select a conversation from the list or start a new one.
      </p>
    </div>
    {onNewChat && (
      <button
        onClick={onNewChat}
        className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors"
      >
        Start New Chat
      </button>
    )}
  </div>
);

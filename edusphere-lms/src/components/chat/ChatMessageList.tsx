import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  searchQuery?: string;
}

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  searchQuery = '',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  // Scroll to bottom when new messages arrive (not on historical load)
  useEffect(() => {
    if (messages.length > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLen.current = messages.length;
  }, [messages.length]);

  // Group messages by date
  const grouped: Record<string, ChatMessage[]> = {};
  for (const msg of messages) {
    const key = msg.date ?? 'Today';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(msg);
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex items-end gap-2 max-w-md ${i % 2 === 0 ? '' : 'ml-auto flex-row-reverse'}`}>
            <Sk className="w-7 h-7 rounded-full shrink-0" />
            <Sk className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8 bg-slate-50/50 dark:bg-slate-950/30">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          No messages yet
        </p>
        <p className="text-xs text-slate-400">Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar bg-slate-50/40 dark:bg-slate-950/20">
      {Object.entries(grouped).map(([dateStr, msgs]) => (
        <div key={dateStr} className="space-y-3">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {dateStr}
            </span>
          </div>

          {msgs.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

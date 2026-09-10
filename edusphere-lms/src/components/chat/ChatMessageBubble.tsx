import React from 'react';
import { FiCheck, FiCheckCircle, FiDownload, FiFileText, FiLoader } from 'react-icons/fi';
import type { ChatMessage } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  searchQuery?: string;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  searchQuery = '',
}) => {
  const { currentUser } = useAuth();
  const isMe = currentUser?.id
    ? message.senderId === currentUser.id
    : message.senderRole === 'student';

  const isPending = message.id.startsWith('opt-');

  const isHighlighted =
    searchQuery.trim() !== '' &&
    message.content.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div
      className={`flex items-end gap-2.5 max-w-2xl ${
        isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
      }`}
    >
      {/* Avatar */}
      <img
        src={message.senderAvatar}
        alt={message.senderName}
        className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 mb-1"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
        }}
      />

      {/* Bubble */}
      <div
        className={`space-y-1.5 p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm transition-opacity ${
          isMe
            ? 'bg-brand-600 text-white rounded-br-none'
            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
        } ${isHighlighted ? 'ring-2 ring-amber-400 ring-offset-2' : ''} ${
          isPending ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {/* Sender name (not-me) */}
        {!isMe && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-brand-600 dark:text-brand-400 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>{message.senderName}</span>
            <span className="text-[9px] bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.5 rounded capitalize">
              {message.senderRole}
            </span>
          </div>
        )}

        {/* Text */}
        {message.content && (
          <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 pt-1">
            {message.attachments.map((att) => {
              if (att.type === 'image') {
                return (
                  <div
                    key={att.id}
                    className="rounded-xl overflow-hidden border border-white/20 dark:border-slate-700 max-w-xs cursor-pointer group"
                    onClick={() => window.open(att.previewUrl ?? att.url, '_blank')}
                  >
                    <img
                      src={att.previewUrl ?? att.url}
                      alt={att.name}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-2 bg-slate-900/80 text-white text-[11px] flex items-center justify-between">
                      <span className="truncate">{att.name}</span>
                      <span className="font-mono text-[10px]">{att.size}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={att.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isMe
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FiFileText className="w-4 h-4 shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">{att.name}</span>
                      <span className="text-[10px] opacity-75">{att.size}</span>
                    </div>
                  </div>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/20 text-current shrink-0"
                    title="Download"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Timestamp + status */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] pt-0.5 ${
            isMe ? 'text-white/70' : 'text-slate-400'
          }`}
        >
          {isPending && <FiLoader className="w-3 h-3 animate-spin" />}
          <span>{message.timestamp}</span>
          {isMe && !isPending && (
            <span title={message.isRead ? 'Read' : 'Delivered'}>
              {message.isRead ? (
                <FiCheckCircle className="w-3 h-3" />
              ) : (
                <FiCheck className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

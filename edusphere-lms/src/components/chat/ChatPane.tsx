import React, { useEffect, useRef } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import type { ChatConversation, ChatMessage } from '../../types';
import { ChatMessageList } from './ChatMessageList';
import { ChatComposer } from './ChatComposer';
import { ChatEmptyState } from './ChatEmptyState';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatRealtime } from '../../hooks/useChatRealtime';
import { chatService } from '../../services/chatService';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

interface ChatPaneProps {
  conversation: ChatConversation | null;
  onBack?: () => void;
  onNewChat?: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  conversation,
  onBack,
  onNewChat,
}) => {
  const { currentUser } = useAuth();
  const { markConversationAsRead } = useChat();
  const markedRef = useRef<string | null>(null);

  const convId = conversation?.id ?? null;

  const {
    messages,
    isLoading,
    addRealtimeMessage,
    addOptimistic,
    confirmOptimisticMessage,
    removeMessage,
  } = useChatMessages(convId);

  // Realtime subscription for incoming messages
  useChatRealtime(convId, currentUser?.id ?? null, (incomingMsg) => {
    // Don't add our own sent messages via realtime — they're already added optimistically
    if (incomingMsg.senderId === currentUser?.id) return;
    addRealtimeMessage(incomingMsg);
  });

  // Mark as read when conversation opens
  useEffect(() => {
    if (!convId || markedRef.current === convId) return;
    markedRef.current = convId;
    chatService.markAsRead(convId).catch(() => {});
    markConversationAsRead?.(convId);
  }, [convId]);

  const handleSend = async (content: string, attachments?: any[]) => {
    if (!convId) return;
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimistic: ChatMessage = {
      id: optimisticId,
      conversationId: convId,
      senderId: currentUser?.id ?? '',
      senderName: currentUser?.name ?? 'You',
      senderAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      senderRole: (currentUser?.role === 'student' ? 'student' : 'instructor') as 'student' | 'instructor',
      content: content.trim(),
      type: attachments && attachments.length > 0
        ? (attachments[0].type === 'image' ? 'image' : 'file')
        : 'text',
      timestamp: timeStr,
      date: 'Today',
      isRead: false,
      attachments: attachments as ChatMessage['attachments'] ?? [],
    };

    // Optimistically show message immediately
    addOptimistic(optimistic);

    try {
      const msgType = attachments && attachments.length > 0
        ? (attachments[0].type === 'image' ? 'image' : 'file')
        : 'text';

      const confirmed = await chatService.sendMessage(convId, {
        content: content.trim(),
        type: msgType as any,
        attachments: attachments as any,
      });

      // Replace optimistic entry with confirmed server message
      confirmOptimisticMessage(optimisticId, {
        ...confirmed,
        senderName: currentUser?.name ?? 'You',
        senderAvatar: currentUser?.avatar ?? confirmed.senderAvatar,
      });
    } catch {
      // Remove failed optimistic message
      removeMessage(optimisticId);
    }
  };

  // No conversation selected
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-900">
        <ChatEmptyState onNewChat={onNewChat} />
      </div>
    );
  }

  const name = conversation.participant?.name ?? conversation.instructorName ?? 'Unknown';
  const avatar =
    conversation.participant?.avatar ??
    conversation.instructorAvatar ??
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const role = conversation.participant?.role ?? '';
  const courseTitle = conversation.courseTitle;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-900 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 shadow-sm">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt={name}
            className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
            }}
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
            {name}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">
            {role && <span className="capitalize">{role}</span>}
            {courseTitle && role && ' · '}
            {courseTitle && <span>{courseTitle}</span>}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ChatMessageList messages={messages} isLoading={isLoading} />

      {/* Composer */}
      <div className="shrink-0">
        <ChatComposer
          conversationId={convId!}
          onSend={handleSend}
        />
      </div>
    </div>
  );
};

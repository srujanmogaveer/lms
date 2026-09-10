import React, { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { ConversationList } from '../../components/chat/ConversationList';
import { ChatPane } from '../../components/chat/ChatPane';
import { ContactPicker } from '../../components/chat/ContactPicker';
import { ChatLoadingSkeleton } from '../../components/chat/ChatLoadingSkeleton';
import { useChatConversations } from '../../hooks/useChatConversations';
import type { ChatConversation } from '../../types';

export const InstructorChat: React.FC = () => {
  const { conversations, isLoading, upsertConversation } = useChatConversations();
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);

  const handleSelectConversation = (conv: ChatConversation) => {
    setActiveConversation(conv);
    setShowMobileList(false);
  };

  const handleConversationReady = (conv: ChatConversation) => {
    upsertConversation(conv);
    setActiveConversation(conv);
    setShowContactPicker(false);
  };

  if (isLoading) {
    return (
      <div className="h-full -m-4 sm:-m-6 flex flex-col">
        <ChatLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="h-full -m-4 sm:-m-6 flex overflow-hidden bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800 shadow-sm">

      <ConversationList
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        onSelect={handleSelectConversation}
        onNewChat={() => setShowContactPicker(true)}
        isMobileVisible={showMobileList}
        onMobileClose={() => setShowMobileList(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {!showMobileList && (
          <div className="flex lg:hidden items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              onClick={() => setShowMobileList(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FiMenu className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {activeConversation
                ? (activeConversation.participant?.name ?? 'Chat')
                : 'Instructor Chat'}
            </span>
          </div>
        )}

        <ChatPane
          conversation={activeConversation}
          onNewChat={() => setShowContactPicker(true)}
          onBack={() => setShowMobileList(true)}
        />
      </div>

      <ContactPicker
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onConversationReady={handleConversationReady}
      />
    </div>
  );
};

export default InstructorChat;

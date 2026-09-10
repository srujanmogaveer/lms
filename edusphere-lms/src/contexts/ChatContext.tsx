import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import { CONVERSATIONS_KEY } from '../hooks/useChatConversations';

export interface ChatContextType {
  /** Total unread messages count across all conversations (null = initial loading, 0 = genuine zero, N = unread count) */
  totalUnreadCount: number | null;
  /** Per-conversation unread counts { [conversationId]: number } */
  unreadByConversation: Record<string, number>;
  /** Force a fresh fetch from the backend */
  refreshUnreadCount: () => Promise<void>;
  /** Preload conversations in background */
  preloadChat: () => Promise<void>;
  /**
   * Optimistically mark a specific conversation as read in the sidebar
   * and call the API to persist it. Safe to call before or instead of
   * chatService.markAsRead() directly.
   */
  markConversationAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [totalUnreadCount, setTotalUnreadCount] = useState<number | null>(null);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});

  // Single Realtime channel — created once per authenticated user
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Debounce timer for refreshes
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Preload Conversations into React Query Cache ─────────────────────────
  const preloadChatConversations = useCallback(
    async (userId: string) => {
      if (!userId) return;
      try {
        await queryClient.prefetchQuery({
          queryKey: CONVERSATIONS_KEY(userId),
          queryFn: async () => {
            return await chatService.getConversations();
          },
          staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
          gcTime: 1000 * 60 * 20, // 20 minutes in-memory retention
        });
      } catch {
        // Non-blocking background prefetch error handled silently
      }
    },
    [queryClient]
  );

  // Public preload helper
  const preloadChat = useCallback(async () => {
    if (currentUser?.id) {
      await Promise.allSettled([
        refreshUnreadCount(),
        preloadChatConversations(currentUser.id),
      ]);
    }
  }, [currentUser?.id, preloadChatConversations]);

  // ─── Core Refresh Unread Count ────────────────────────────────────────────
  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser?.id) {
      setTotalUnreadCount(null);
      setUnreadByConversation({});
      return;
    }

    try {
      const data = await chatService.getUnreadCount();
      const total = Number(data.totalUnreadCount) || 0;
      const byConv = data.unreadByConversation || {};
      setTotalUnreadCount(total);
      setUnreadByConversation(byConv);
    } catch {
      // On error, preserve existing state
    }
  }, [currentUser?.id]);

  /** Debounced refresh to batch rapid Realtime events */
  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshUnreadCount();
      if (currentUser?.id) {
        queryClient.invalidateQueries({
          queryKey: CONVERSATIONS_KEY(currentUser.id),
        });
      }
    }, 300);
  }, [refreshUnreadCount, currentUser?.id, queryClient]);

  // ─── Optimistic Mark-As-Read ──────────────────────────────────────────────
  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId || conversationId.startsWith('draft-')) return;

      // 1. Optimistic local update — subtract this conversation's count from total
      setUnreadByConversation((prev) => {
        const convUnread = prev[conversationId] ?? 0;
        if (convUnread > 0) {
          setTotalUnreadCount((tot) => Math.max(0, (tot ?? 0) - convUnread));
        }
        return { ...prev, [conversationId]: 0 };
      });

      // 2. Persist to backend (also dispatches chat:unread-updated)
      try {
        await chatService.markAsRead(conversationId);
      } catch {
        // Re-sync on failure
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount]
  );

  // ─── Setup/Teardown per User ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) {
      // Logout: clear state, cache, and remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setTotalUnreadCount(null);
      setUnreadByConversation({});
      return;
    }

    const uid = currentUser.id;

    // 1. Immediate silent background preloading (does NOT block dashboard render)
    refreshUnreadCount();
    preloadChatConversations(uid);

    // 2. Scoped Supabase Realtime channel for this specific user
    const channelName = `chat-unread-${uid}`;

    // Remove stale channel if re-authenticating
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(channelName)
      // Listen only to participant record changes specifically for this user
      // Fired when someone sends a message (unread increments) or user reads messages (unread resets)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          debouncedRefresh();
        }
      )
      .subscribe();

    channelRef.current = channel;

    // 3. Cross-tab / cross-component sync via custom DOM event
    const handleLocalUpdate = () => debouncedRefresh();
    window.addEventListener('chat:unread-updated', handleLocalUpdate);

    // 4. Re-sync when user returns to the tab
    window.addEventListener('focus', handleLocalUpdate);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      window.removeEventListener('chat:unread-updated', handleLocalUpdate);
      window.removeEventListener('focus', handleLocalUpdate);
    };
  }, [currentUser?.id, refreshUnreadCount, preloadChatConversations, debouncedRefresh]);

  return (
    <ChatContext.Provider
      value={{
        totalUnreadCount,
        unreadByConversation,
        refreshUnreadCount,
        preloadChat,
        markConversationAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import type { ChatConversation } from '../types';

export const CONVERSATIONS_KEY = (userId?: string) =>
  ['chat', 'conversations', userId ?? 'anon'] as const;

export function useChatConversations() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CONVERSATIONS_KEY(userId),
    queryFn: () => chatService.getConversations(),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
  });

  /** Optimistically update a single conversation in cache */
  const updateConversation = (
    conversationId: string,
    updater: (prev: ChatConversation) => ChatConversation
  ) => {
    queryClient.setQueryData<ChatConversation[]>(
      CONVERSATIONS_KEY(userId),
      (prev) =>
        prev
          ? prev.map((c) => (c.id === conversationId ? updater(c) : c))
          : []
    );
  };

  /** Add or update conversation in cache */
  const upsertConversation = (conv: ChatConversation) => {
    queryClient.setQueryData<ChatConversation[]>(
      CONVERSATIONS_KEY(userId),
      (prev) => {
        if (!prev) return [conv];
        const idx = prev.findIndex((c) => c.id === conv.id);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = conv;
          return copy;
        }
        return [conv, ...prev];
      }
    );
  };

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading && !query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    updateConversation,
    upsertConversation,
  };
}

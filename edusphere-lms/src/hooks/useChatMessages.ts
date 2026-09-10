import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage } from '../types';

export const MESSAGES_KEY = (userId?: string, conversationId?: string | null) =>
  ['chat', 'messages', userId ?? 'anon', conversationId ?? 'none'] as const;

/**
 * Upsert a message into a list, deduplicating by id.
 * Pending messages use 'opt-' prefix; on server confirmation they are replaced by real UUID.
 */
function upsertMsg(list: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const idx = list.findIndex((m) => m.id === msg.id);
  if (idx !== -1) {
    const copy = [...list];
    copy[idx] = msg;
    return copy;
  }
  return [...list, msg];
}

export function useChatMessages(conversationId: string | null) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  const isRealConv = Boolean(
    conversationId && !conversationId.startsWith('draft-')
  );

  const query = useQuery({
    queryKey: MESSAGES_KEY(userId, conversationId),
    queryFn: () => chatService.getMessages(conversationId!),
    enabled: isRealConv && Boolean(userId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
  });

  /** Called by Realtime to inject an incoming message */
  const addRealtimeMessage = (msg: ChatMessage) => {
    if (!msg.conversationId) return;
    queryClient.setQueryData<ChatMessage[]>(
      MESSAGES_KEY(userId, msg.conversationId),
      (prev) => upsertMsg(prev ?? [], msg)
    );
  };

  /** Replace an optimistic message with the confirmed server message */
  const confirmOptimisticMessage = (optimisticId: string, confirmed: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      MESSAGES_KEY(userId, confirmed.conversationId),
      (prev) => {
        if (!prev) return [confirmed];
        // Remove optimistic entry, add confirmed (upsert by real id)
        const filtered = prev.filter((m) => m.id !== optimisticId);
        return upsertMsg(filtered, confirmed);
      }
    );
  };

  /** Add an optimistic message immediately on send */
  const addOptimistic = (msg: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      MESSAGES_KEY(userId, msg.conversationId),
      (prev) => [...(prev ?? []), msg]
    );
  };

  /** Remove a message by id (e.g., failed optimistic) */
  const removeMessage = (id: string) => {
    if (!conversationId) return;
    queryClient.setQueryData<ChatMessage[]>(
      MESSAGES_KEY(userId, conversationId),
      (prev) => (prev ?? []).filter((m) => m.id !== id)
    );
  };

  const sendMutation = useMutation({
    mutationFn: ({
      convId,
      content,
      type,
      attachments,
    }: {
      convId: string;
      content: string;
      type?: string;
      attachments?: ChatMessage['attachments'];
    }) =>
      chatService.sendMessage(convId, {
        content,
        type: (type as any) ?? 'text',
        attachments,
      }),
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading && !query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    addRealtimeMessage,
    addOptimistic,
    confirmOptimisticMessage,
    removeMessage,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

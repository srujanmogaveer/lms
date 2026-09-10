import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

// Module-level cache for sender profiles (avoids repeated DB lookups)
const profileCache = new Map<string, { name: string; avatar: string; role: string }>();

/**
 * Subscribe to new messages on a conversation in real-time.
 * @param conversationId  Real UUID from DB (draft/opt/fake IDs are ignored)
 * @param currentUserId   The authenticated user's own ID — own messages are skipped at the
 *                        hook level so they never reach onMessage, preventing duplicates.
 * @param onMessage       Called for every incoming message from ANOTHER user
 */
export function useChatRealtime(
  conversationId: string | null,
  currentUserId: string | null,
  onMessage: (msg: ChatMessage) => void
) {
  const seenIds = useRef<Set<string>>(new Set());
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  // Keep currentUserId in a ref so the async callback always has the latest value
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    // Only subscribe to real, non-draft/non-synthetic conversation IDs
    if (
      !conversationId ||
      conversationId.startsWith('draft-') ||
      conversationId.startsWith('opt-') ||
      conversationId.startsWith('conv-admin-')
    ) {
      return;
    }

    seenIds.current.clear();

    const channelName = `chat:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row?.id) return;

          // Skip own messages at the hook level — prevents duplicates regardless of
          // whether the optimistic confirm has completed yet
          if (row.sender_id && row.sender_id === currentUserIdRef.current) return;

          // Deduplicate — each realtime INSERT fires exactly once per message
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          // Resolve sender from cache or DB
          let senderName = 'User';
          let senderAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
          let senderRole = 'student';

          if (row.sender_id) {
            const cached = profileCache.get(row.sender_id);
            if (cached) {
              senderName = cached.name;
              senderAvatar = cached.avatar;
              senderRole = cached.role;
            } else {
              try {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url, role')
                  .eq('id', row.sender_id)
                  .maybeSingle();
                if (prof) {
                  senderName = prof.full_name ?? senderName;
                  senderAvatar = prof.avatar_url ?? senderAvatar;
                  senderRole = prof.role ?? senderRole;
                  profileCache.set(row.sender_id, {
                    name: senderName,
                    avatar: senderAvatar,
                    role: senderRole,
                  });
                }
              } catch {
                // use defaults
              }
            }
          }

          const now = new Date(row.created_at ?? Date.now());
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const today = new Date().toISOString().split('T')[0];
          const msgDate = now.toISOString().split('T')[0];
          const dateStr = msgDate === today ? 'Today' : now.toLocaleDateString();

          const msg: ChatMessage = {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderName,
            senderAvatar,
            senderRole: senderRole as any,
            content: row.content ?? '',
            type: row.type ?? 'text',
            timestamp: timeStr,
            date: dateStr,
            isRead: row.is_read ?? false,
            attachments: [],
          };

          onMessageRef.current(msg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

export function clearRealtimeProfileCache() {
  profileCache.clear();
}

// Alias for backward compatibility with AuthContext import
export const clearSenderProfileCache = clearRealtimeProfileCache;

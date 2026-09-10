-- ============================================================
-- 017: Chat System Fixes
-- Sets REPLICA IDENTITY FULL on conversation_participants so
-- Supabase Realtime UPDATE events expose old/new row data,
-- enabling row-level filtering in postgres_changes subscriptions.
-- Also ensures unread_count defaults and indexes are correct.
-- ============================================================

BEGIN;

-- 1. Set REPLICA IDENTITY FULL so Realtime can filter on user_id
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Ensure unread_count column exists and defaults to 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'conversation_participants'
          AND column_name = 'unread_count'
    ) THEN
        ALTER TABLE public.conversation_participants ADD COLUMN unread_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END;
$$;

-- 3. Ensure last_read_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'conversation_participants'
          AND column_name = 'last_read_at'
    ) THEN
        ALTER TABLE public.conversation_participants ADD COLUMN last_read_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END;
$$;

-- 4. Index on user_id for fast unread count lookups
CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON public.conversation_participants(user_id);

-- 5. Index on conversation_id + user_id for fast mark-as-read
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_user ON public.conversation_participants(conversation_id, user_id);

-- 6. Index on messages for fast conversation + sender lookups
CREATE INDEX IF NOT EXISTS idx_messages_conv_sender ON public.messages(conversation_id, sender_id);

-- 7. Index on messages.created_at for pagination
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(conversation_id, created_at DESC);

COMMIT;

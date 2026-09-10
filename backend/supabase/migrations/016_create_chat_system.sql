-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 016: CHAT & DIRECT MESSAGING SYSTEM (FINAL HARDENED)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CONVERSATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type TEXT NOT NULL
        CHECK (type IN ('student_instructor', 'admin_instructor')),

    student_id UUID
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    instructor_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    admin_id UUID
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    course_id UUID
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    created_by UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    last_message_text TEXT,

    last_message_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checks for structure validity
ALTER TABLE public.conversations
    DROP CONSTRAINT IF EXISTS chk_student_instructor_conv;

ALTER TABLE public.conversations
    ADD CONSTRAINT chk_student_instructor_conv
    CHECK (
        (type = 'student_instructor' AND student_id IS NOT NULL AND course_id IS NOT NULL AND admin_id IS NULL)
        OR
        (type = 'admin_instructor' AND admin_id IS NOT NULL AND student_id IS NULL AND course_id IS NULL)
    );

-- Uniqueness: Student ↔ Instructor (One per student + instructor + course)
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_instructor_course_conv
ON public.conversations (student_id, instructor_id, course_id)
WHERE type = 'student_instructor';

-- Uniqueness: Admin ↔ Instructor (One per admin + instructor)
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_instructor_conv
ON public.conversations (admin_id, instructor_id)
WHERE type = 'admin_instructor';


-- ============================================================
-- 2. CONVERSATION PARTICIPANTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES public.conversations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    role TEXT NOT NULL
        CHECK (role IN ('student', 'instructor', 'admin')),

    unread_count INTEGER NOT NULL DEFAULT 0
        CHECK (unread_count >= 0),

    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_user
ON public.conversation_participants(conversation_id, user_id);


-- ============================================================
-- 3. MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES public.conversations(id)
        ON DELETE CASCADE,

    sender_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    content TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'text'
        CHECK (type IN ('text', 'image', 'file', 'link')),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. MESSAGE ATTACHMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    message_id UUID NOT NULL
        REFERENCES public.messages(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    size TEXT NOT NULL,

    type TEXT NOT NULL
        CHECK (type IN ('image', 'pdf', 'doc', 'archive', 'other')),

    url TEXT NOT NULL,

    preview_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_instructor_id ON public.conversations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_course_id ON public.conversations(course_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.message_attachments(message_id);


-- ============================================================
-- 6. TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_chat_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_chat_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_chat_updated_at();


CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- 1. Update conversation last message preview
    UPDATE public.conversations
    SET
        last_message_text =
            CASE
                WHEN NEW.type = 'image' THEN '[Image Attachment]'
                WHEN NEW.type = 'file' THEN '[File Attachment]'
                ELSE NEW.content
            END,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- 2. Increment unread count for recipients
    UPDATE public.conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
      AND user_id <> NEW.sender_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_chat_message ON public.messages;
CREATE TRIGGER trg_new_chat_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_chat_message();


-- ============================================================
-- 7. ROW LEVEL SECURITY (HARDENED & NON-RECURSIVE)
-- ============================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant"
ON public.conversations FOR SELECT TO authenticated
USING (
    student_id = auth.uid()
    OR instructor_id = auth.uid()
    OR admin_id = auth.uid()
    OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;
CREATE POLICY "conversations_insert_auth"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
    created_by = auth.uid()
);

-- Conversation Participants RLS (Non-recursive)
DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;
CREATE POLICY "participants_select_policy"
ON public.conversation_participants FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND (c.student_id = auth.uid() OR c.instructor_id = auth.uid() OR c.admin_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "participants_insert_policy" ON public.conversation_participants;
CREATE POLICY "participants_insert_policy"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_participants.conversation_id
          AND c.created_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;
CREATE POLICY "participants_update_policy"
ON public.conversation_participants FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Messages RLS (Non-recursive)
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant"
ON public.messages FOR SELECT TO authenticated
USING (
    sender_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.student_id = auth.uid() OR c.instructor_id = auth.uid() OR c.admin_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (c.student_id = auth.uid() OR c.instructor_id = auth.uid() OR c.admin_id = auth.uid())
    )
);

-- Message Attachments RLS
DROP POLICY IF EXISTS "attachments_select_participant" ON public.message_attachments;
CREATE POLICY "attachments_select_participant"
ON public.message_attachments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE m.id = message_attachments.message_id
          AND (c.student_id = auth.uid() OR c.instructor_id = auth.uid() OR c.admin_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "attachments_insert_participant" ON public.message_attachments;
CREATE POLICY "attachments_insert_participant"
ON public.message_attachments FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
        WHERE m.id = message_attachments.message_id
          AND (c.student_id = auth.uid() OR c.instructor_id = auth.uid() OR c.admin_id = auth.uid())
    )
);


-- ============================================================
-- 8. ENABLE REALTIME PUBLICATION
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;


-- ============================================================
-- 9. STORAGE BUCKET & POLICIES FOR CHAT ATTACHMENTS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments',
    'chat-attachments',
    true,
    26214400, -- 25 MB max limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 26214400;

DROP POLICY IF EXISTS "Chat attachments are publicly readable" ON storage.objects;
CREATE POLICY "Chat attachments are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Users can update chat attachments" ON storage.objects;
CREATE POLICY "Users can update chat attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Users can delete chat attachments" ON storage.objects;
CREATE POLICY "Users can delete chat attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments');

COMMIT;


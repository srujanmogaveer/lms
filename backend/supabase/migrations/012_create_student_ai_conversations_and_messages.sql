-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 012
-- STUDENT AI CONVERSATIONS, MESSAGES & USAGE TRACKING
-- ============================================================

BEGIN;

-- ============================================================
-- 1. AI CONVERSATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    course_id UUID
        REFERENCES public.courses(id)
        ON DELETE SET NULL,

    lesson_id UUID
        REFERENCES public.lessons(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL DEFAULT 'New Study Session',

    context_type VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (
            context_type IN (
                'general',
                'course',
                'lesson',
                'assignment',
                'quiz'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_student_id
    ON public.ai_conversations(student_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_course_id
    ON public.ai_conversations(course_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_lesson_id
    ON public.ai_conversations(lesson_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at
    ON public.ai_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Granular RLS Policies for ai_conversations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_conversations' AND policyname = 'Students can view their own AI conversations'
    ) THEN
        CREATE POLICY "Students can view their own AI conversations"
            ON public.ai_conversations
            FOR SELECT
            USING (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_conversations' AND policyname = 'Students can create their own AI conversations'
    ) THEN
        CREATE POLICY "Students can create their own AI conversations"
            ON public.ai_conversations
            FOR INSERT
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_conversations' AND policyname = 'Students can update their own AI conversations'
    ) THEN
        CREATE POLICY "Students can update their own AI conversations"
            ON public.ai_conversations
            FOR UPDATE
            USING (auth.uid() = student_id)
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_conversations' AND policyname = 'Students can delete their own AI conversations'
    ) THEN
        CREATE POLICY "Students can delete their own AI conversations"
            ON public.ai_conversations
            FOR DELETE
            USING (auth.uid() = student_id);
    END IF;
END $$;


-- ============================================================
-- 2. AI MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES public.ai_conversations(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('user', 'assistant', 'system')),

    content TEXT NOT NULL,

    tokens_used INTEGER NOT NULL DEFAULT 0
        CHECK (tokens_used >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_messages
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id
    ON public.ai_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_student_id
    ON public.ai_messages(student_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at
    ON public.ai_messages(created_at ASC);

-- Enable RLS
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Granular RLS Policies for ai_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_messages' AND policyname = 'Students can view their own AI messages'
    ) THEN
        CREATE POLICY "Students can view their own AI messages"
            ON public.ai_messages
            FOR SELECT
            USING (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_messages' AND policyname = 'Students can insert their own AI messages'
    ) THEN
        CREATE POLICY "Students can insert their own AI messages"
            ON public.ai_messages
            FOR INSERT
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_messages' AND policyname = 'Students can delete their own AI messages'
    ) THEN
        CREATE POLICY "Students can delete their own AI messages"
            ON public.ai_messages
            FOR DELETE
            USING (auth.uid() = student_id);
    END IF;
END $$;


-- ============================================================
-- 3. AI USAGE LOGS (DAILY RATE-LIMIT TRACKING)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    tokens_consumed INTEGER NOT NULL DEFAULT 0
        CHECK (tokens_consumed >= 0),

    request_count INTEGER NOT NULL DEFAULT 0
        CHECK (request_count >= 0),

    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ai_usage_student_date UNIQUE (student_id, usage_date)
);

-- Indexes for ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_student_date
    ON public.ai_usage_logs(student_id, usage_date);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Granular RLS Policies for ai_usage_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND policyname = 'Students can view their own AI usage'
    ) THEN
        CREATE POLICY "Students can view their own AI usage"
            ON public.ai_usage_logs
            FOR SELECT
            USING (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND policyname = 'Students can update their own AI usage'
    ) THEN
        CREATE POLICY "Students can update their own AI usage"
            ON public.ai_usage_logs
            FOR UPDATE
            USING (auth.uid() = student_id)
            WITH CHECK (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND policyname = 'Students can insert their own AI usage'
    ) THEN
        CREATE POLICY "Students can insert their own AI usage"
            ON public.ai_usage_logs
            FOR INSERT
            WITH CHECK (auth.uid() = student_id);
    END IF;
END $$;


-- ============================================================
-- 4. AUTO-UPDATE TRIGGER FOR ai_conversations.updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_conversations_updated_at ON public.ai_conversations;

CREATE TRIGGER trigger_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_ai_conversations_updated_at();

COMMIT;

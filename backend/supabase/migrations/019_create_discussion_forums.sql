-- ============================================================================
-- EDUSPHERE LMS
-- MIGRATION 019: DISCUSSION FORUMS, REPLIES, REACTIONS, ATTACHMENTS & MODERATION
-- CORRECTED VERSION
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. COURSE DISCUSSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.course_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    author_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    category TEXT NOT NULL
        CHECK (
            category IN (
                'General Discussion',
                'Assignments',
                'Quizzes',
                'Course Content',
                'Technical Issues',
                'Announcements'
            )
        ),

    title TEXT NOT NULL
        CHECK (
            char_length(trim(title)) >= 5
            AND char_length(title) <= 255
        ),

    content TEXT NOT NULL
        CHECK (char_length(trim(content)) >= 10),

    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_solved BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,

    views_count INTEGER NOT NULL DEFAULT 0
        CHECK (views_count >= 0),

    likes_count INTEGER NOT NULL DEFAULT 0
        CHECK (likes_count >= 0),

    replies_count INTEGER NOT NULL DEFAULT 0
        CHECK (replies_count >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_discussions_course_id
ON public.course_discussions(course_id);

CREATE INDEX IF NOT EXISTS idx_course_discussions_author_id
ON public.course_discussions(author_id);

CREATE INDEX IF NOT EXISTS idx_course_discussions_category
ON public.course_discussions(category);

CREATE INDEX IF NOT EXISTS idx_course_discussions_course_created
ON public.course_discussions(course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_discussions_pinned_latest
ON public.course_discussions(course_id, is_pinned DESC, created_at DESC);


-- ============================================================================
-- 2. DISCUSSION REPLIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    discussion_id UUID NOT NULL
        REFERENCES public.course_discussions(id)
        ON DELETE CASCADE,

    author_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL
        CHECK (char_length(trim(content)) >= 1),

    is_accepted_answer BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

    likes_count INTEGER NOT NULL DEFAULT 0
        CHECK (likes_count >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id
ON public.discussion_replies(discussion_id);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_author_id
ON public.discussion_replies(author_id);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_created_at
ON public.discussion_replies(discussion_id, created_at ASC);


-- ============================================================================
-- 3. DISCUSSION REACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    target_type TEXT NOT NULL
        CHECK (target_type IN ('discussion', 'reply')),

    target_id UUID NOT NULL,

    reaction TEXT NOT NULL DEFAULT 'like'
        CHECK (reaction = 'like'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_target_reaction
        UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_reactions_target
ON public.discussion_reactions(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_discussion_reactions_user
ON public.discussion_reactions(user_id);


-- ============================================================================
-- 4. DISCUSSION ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    discussion_id UUID NULL
        REFERENCES public.course_discussions(id)
        ON DELETE CASCADE,

    reply_id UUID NULL
        REFERENCES public.discussion_replies(id)
        ON DELETE CASCADE,

    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size TEXT NOT NULL,

    file_type TEXT NOT NULL DEFAULT 'other'
        CHECK (
            file_type IN (
                'image',
                'code',
                'pdf',
                'zip',
                'doc',
                'other'
            )
        ),

    uploaded_by UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one target
    CONSTRAINT chk_attachment_exactly_one_target
        CHECK (
            (discussion_id IS NOT NULL AND reply_id IS NULL)
            OR
            (discussion_id IS NULL AND reply_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_discussion_attachments_disc
ON public.discussion_attachments(discussion_id);

CREATE INDEX IF NOT EXISTS idx_discussion_attachments_reply
ON public.discussion_attachments(reply_id);


-- ============================================================================
-- 5. MODERATION REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_moderation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    target_type TEXT NOT NULL
        CHECK (target_type IN ('discussion', 'reply')),

    target_id UUID NOT NULL,

    reason TEXT NOT NULL
        CHECK (char_length(trim(reason)) >= 3),

    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (
            status IN (
                'Pending',
                'Reviewed',
                'Dismissed',
                'Actioned'
            )
        ),

    reviewed_by UUID NULL
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    resolution_notes TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_discussion_reports_status
ON public.discussion_moderation_reports(status);

CREATE INDEX IF NOT EXISTS idx_discussion_reports_target
ON public.discussion_moderation_reports(target_type, target_id);


-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(
    p_course_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.enrollments
        WHERE course_id = p_course_id
          AND student_id = p_user_id
          AND status IN ('Active', 'Completed')
    );
$$;


CREATE OR REPLACE FUNCTION public.is_course_instructor(
    p_course_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.courses
        WHERE id = p_course_id
          AND instructor_id = p_user_id
    );
$$;


CREATE OR REPLACE FUNCTION public.is_platform_admin(
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_user_id
          AND role = 'admin'
    );
$$;


-- ============================================================================
-- 7. GET COURSE ID FROM DISCUSSION/REPLY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_discussion_course_id(
    p_discussion_id UUID
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT course_id
    FROM public.course_discussions
    WHERE id = p_discussion_id;
$$;


CREATE OR REPLACE FUNCTION public.get_reply_course_id(
    p_reply_id UUID
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT cd.course_id
    FROM public.discussion_replies dr
    JOIN public.course_discussions cd
        ON cd.id = dr.discussion_id
    WHERE dr.id = p_reply_id;
$$;


-- ============================================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_discussion_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_course_discussions_updated_at
ON public.course_discussions;

CREATE TRIGGER trigger_set_course_discussions_updated_at
BEFORE UPDATE ON public.course_discussions
FOR EACH ROW
EXECUTE FUNCTION public.set_discussion_updated_at();


DROP TRIGGER IF EXISTS trigger_set_discussion_replies_updated_at
ON public.discussion_replies;

CREATE TRIGGER trigger_set_discussion_replies_updated_at
BEFORE UPDATE ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.set_discussion_updated_at();


-- ============================================================================
-- 9. REPLY COUNT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_discussion_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN

    IF TG_OP = 'INSERT' THEN

        UPDATE public.course_discussions
        SET
            replies_count = replies_count + 1,
            updated_at = NOW()
        WHERE id = NEW.discussion_id;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN

        UPDATE public.course_discussions
        SET
            replies_count = GREATEST(0, replies_count - 1),
            updated_at = NOW()
        WHERE id = OLD.discussion_id;

        RETURN OLD;

    END IF;

    RETURN NULL;
END;
$$;


DROP TRIGGER IF EXISTS trigger_sync_discussion_replies_count
ON public.discussion_replies;

CREATE TRIGGER trigger_sync_discussion_replies_count
AFTER INSERT OR DELETE ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.sync_discussion_replies_count();


-- ============================================================================
-- 10. LIKE COUNT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_discussion_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN

    IF TG_OP = 'INSERT' THEN

        IF NEW.target_type = 'discussion' THEN

            UPDATE public.course_discussions
            SET likes_count = likes_count + 1
            WHERE id = NEW.target_id;

        ELSIF NEW.target_type = 'reply' THEN

            UPDATE public.discussion_replies
            SET likes_count = likes_count + 1
            WHERE id = NEW.target_id;

        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN

        IF OLD.target_type = 'discussion' THEN

            UPDATE public.course_discussions
            SET likes_count = GREATEST(0, likes_count - 1)
            WHERE id = OLD.target_id;

        ELSIF OLD.target_type = 'reply' THEN

            UPDATE public.discussion_replies
            SET likes_count = GREATEST(0, likes_count - 1)
            WHERE id = OLD.target_id;

        END IF;

        RETURN OLD;

    END IF;

    RETURN NULL;
END;
$$;


DROP TRIGGER IF EXISTS trigger_sync_discussion_likes_count
ON public.discussion_reactions;

CREATE TRIGGER trigger_sync_discussion_likes_count
AFTER INSERT OR DELETE ON public.discussion_reactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_discussion_likes_count();


-- ============================================================================
-- 11. SECURE VIEW COUNTER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_discussion_views(
    p_discussion_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_course_id UUID;
BEGIN

    SELECT course_id
    INTO v_course_id
    FROM public.course_discussions
    WHERE id = p_discussion_id;

    IF v_course_id IS NULL THEN
        RAISE EXCEPTION 'Discussion not found';
    END IF;

    IF NOT (
        public.is_enrolled_in_course(v_course_id, auth.uid())
        OR public.is_course_instructor(v_course_id, auth.uid())
        OR public.is_platform_admin(auth.uid())
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    UPDATE public.course_discussions
    SET views_count = views_count + 1
    WHERE id = p_discussion_id;
END;
$$;


-- ============================================================================
-- 12. RLS
-- ============================================================================

ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_moderation_reports ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 13. DISCUSSION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Discussions viewable by enrolled students, instructor, admin"
ON public.course_discussions;

CREATE POLICY "Discussions viewable by enrolled students, instructor, admin"
ON public.course_discussions
FOR SELECT
TO authenticated
USING (
    public.is_enrolled_in_course(course_id, auth.uid())
    OR public.is_course_instructor(course_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
);


DROP POLICY IF EXISTS "Discussions creatable by enrolled students, instructor, admin"
ON public.course_discussions;

CREATE POLICY "Discussions creatable by enrolled students, instructor, admin"
ON public.course_discussions
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = author_id
    AND (
        public.is_enrolled_in_course(course_id, auth.uid())
        OR public.is_course_instructor(course_id, auth.uid())
        OR public.is_platform_admin(auth.uid())
    )
);


DROP POLICY IF EXISTS "Discussions updatable by author, instructor, admin"
ON public.course_discussions;

CREATE POLICY "Discussions updatable by author, instructor, admin"
ON public.course_discussions
FOR UPDATE
TO authenticated
USING (
    auth.uid() = author_id
    OR public.is_course_instructor(course_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
)
WITH CHECK (
    auth.uid() = author_id
    OR public.is_course_instructor(course_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
);


DROP POLICY IF EXISTS "Discussions deletable by author, instructor, admin"
ON public.course_discussions;

CREATE POLICY "Discussions deletable by author, instructor, admin"
ON public.course_discussions
FOR DELETE
TO authenticated
USING (
    (
        auth.uid() = author_id
        AND replies_count = 0
    )
    OR public.is_course_instructor(course_id, auth.uid())
    OR public.is_platform_admin(auth.uid())
);


-- ============================================================================
-- 14. REPLY POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Replies viewable by course participants"
ON public.discussion_replies;

CREATE POLICY "Replies viewable by course participants"
ON public.discussion_replies
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_replies.discussion_id
        AND (
            public.is_enrolled_in_course(cd.course_id, auth.uid())
            OR public.is_course_instructor(cd.course_id, auth.uid())
            OR public.is_platform_admin(auth.uid())
        )
    )
);


DROP POLICY IF EXISTS "Replies creatable by course participants"
ON public.discussion_replies;

CREATE POLICY "Replies creatable by course participants"
ON public.discussion_replies
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_replies.discussion_id
        AND cd.is_locked = FALSE
        AND (
            public.is_enrolled_in_course(cd.course_id, auth.uid())
            OR public.is_course_instructor(cd.course_id, auth.uid())
            OR public.is_platform_admin(auth.uid())
        )
    )
);


DROP POLICY IF EXISTS "Replies updatable by author, instructor, admin"
ON public.discussion_replies;

CREATE POLICY "Replies updatable by author, instructor, admin"
ON public.discussion_replies
FOR UPDATE
TO authenticated
USING (
    auth.uid() = author_id
    OR EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_replies.discussion_id
        AND (
            public.is_course_instructor(cd.course_id, auth.uid())
            OR public.is_platform_admin(auth.uid())
        )
    )
)
WITH CHECK (
    auth.uid() = author_id
    OR EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_replies.discussion_id
        AND (
            public.is_course_instructor(cd.course_id, auth.uid())
            OR public.is_platform_admin(auth.uid())
        )
    )
);


DROP POLICY IF EXISTS "Replies deletable by author, instructor, admin"
ON public.discussion_replies;

CREATE POLICY "Replies deletable by author, instructor, admin"
ON public.discussion_replies
FOR DELETE
TO authenticated
USING (
    auth.uid() = author_id
    OR EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_replies.discussion_id
        AND (
            public.is_course_instructor(cd.course_id, auth.uid())
            OR public.is_platform_admin(auth.uid())
        )
    )
);


-- ============================================================================
-- 15. REACTION POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Reactions viewable by course participants"
ON public.discussion_reactions;

CREATE POLICY "Reactions viewable by course participants"
ON public.discussion_reactions
FOR SELECT
TO authenticated
USING (
    (
        target_type = 'discussion'
        AND EXISTS (
            SELECT 1
            FROM public.course_discussions cd
            WHERE cd.id = discussion_reactions.target_id
            AND (
                public.is_enrolled_in_course(cd.course_id, auth.uid())
                OR public.is_course_instructor(cd.course_id, auth.uid())
                OR public.is_platform_admin(auth.uid())
            )
        )
    )
    OR
    (
        target_type = 'reply'
        AND EXISTS (
            SELECT 1
            FROM public.discussion_replies dr
            JOIN public.course_discussions cd
                ON cd.id = dr.discussion_id
            WHERE dr.id = discussion_reactions.target_id
            AND (
                public.is_enrolled_in_course(cd.course_id, auth.uid())
                OR public.is_course_instructor(cd.course_id, auth.uid())
                OR public.is_platform_admin(auth.uid())
            )
        )
    )
);


DROP POLICY IF EXISTS "Users can insert own reactions"
ON public.discussion_reactions;

CREATE POLICY "Users can insert own reactions"
ON public.discussion_reactions
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND (
        (
            target_type = 'discussion'
            AND EXISTS (
                SELECT 1
                FROM public.course_discussions cd
                WHERE cd.id = discussion_reactions.target_id
                AND (
                    public.is_enrolled_in_course(cd.course_id, auth.uid())
                    OR public.is_course_instructor(cd.course_id, auth.uid())
                    OR public.is_platform_admin(auth.uid())
                )
            )
        )
        OR
        (
            target_type = 'reply'
            AND EXISTS (
                SELECT 1
                FROM public.discussion_replies dr
                JOIN public.course_discussions cd
                    ON cd.id = dr.discussion_id
                WHERE dr.id = discussion_reactions.target_id
                AND (
                    public.is_enrolled_in_course(cd.course_id, auth.uid())
                    OR public.is_course_instructor(cd.course_id, auth.uid())
                    OR public.is_platform_admin(auth.uid())
                )
            )
        )
    )
);


DROP POLICY IF EXISTS "Users can delete own reactions"
ON public.discussion_reactions;

CREATE POLICY "Users can delete own reactions"
ON public.discussion_reactions
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id
);


-- ============================================================================
-- 16. ATTACHMENT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Attachments viewable by course participants"
ON public.discussion_attachments;

CREATE POLICY "Attachments viewable by course participants"
ON public.discussion_attachments
FOR SELECT
TO authenticated
USING (
    (
        discussion_id IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.course_discussions cd
            WHERE cd.id = discussion_attachments.discussion_id
            AND (
                public.is_enrolled_in_course(cd.course_id, auth.uid())
                OR public.is_course_instructor(cd.course_id, auth.uid())
                OR public.is_platform_admin(auth.uid())
            )
        )
    )
    OR
    (
        reply_id IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.discussion_replies dr
            JOIN public.course_discussions cd
                ON cd.id = dr.discussion_id
            WHERE dr.id = discussion_attachments.reply_id
            AND (
                public.is_enrolled_in_course(cd.course_id, auth.uid())
                OR public.is_course_instructor(cd.course_id, auth.uid())
                OR public.is_platform_admin(auth.uid())
            )
        )
    )
);


DROP POLICY IF EXISTS "Attachments insertable by uploader"
ON public.discussion_attachments;

CREATE POLICY "Attachments insertable by uploader"
ON public.discussion_attachments
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = uploaded_by
    AND (
        (
            discussion_id IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.course_discussions cd
                WHERE cd.id = discussion_attachments.discussion_id
                AND (
                    public.is_enrolled_in_course(cd.course_id, auth.uid())
                    OR public.is_course_instructor(cd.course_id, auth.uid())
                    OR public.is_platform_admin(auth.uid())
                )
            )
        )
        OR
        (
            reply_id IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.discussion_replies dr
                JOIN public.course_discussions cd
                    ON cd.id = dr.discussion_id
                WHERE dr.id = discussion_attachments.reply_id
                AND (
                    public.is_enrolled_in_course(cd.course_id, auth.uid())
                    OR public.is_course_instructor(cd.course_id, auth.uid())
                    OR public.is_platform_admin(auth.uid())
                )
            )
        )
    )
);


-- ============================================================================
-- 17. MODERATION REPORT POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can create reports"
ON public.discussion_moderation_reports;

CREATE POLICY "Users can create reports"
ON public.discussion_moderation_reports
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = reporter_id
);


DROP POLICY IF EXISTS "Instructors and Admins can view and resolve reports"
ON public.discussion_moderation_reports;

CREATE POLICY "Instructors and Admins can view and resolve reports"
ON public.discussion_moderation_reports
FOR SELECT
TO authenticated
USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_moderation_reports.target_id
          AND discussion_moderation_reports.target_type = 'discussion'
          AND public.is_course_instructor(cd.course_id, auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.discussion_replies dr
        JOIN public.course_discussions cd
            ON cd.id = dr.discussion_id
        WHERE dr.id = discussion_moderation_reports.target_id
          AND discussion_moderation_reports.target_type = 'reply'
          AND public.is_course_instructor(cd.course_id, auth.uid())
    )
);


DROP POLICY IF EXISTS "Instructors and Admins can update reports"
ON public.discussion_moderation_reports;

CREATE POLICY "Instructors and Admins can update reports"
ON public.discussion_moderation_reports
FOR UPDATE
TO authenticated
USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
        SELECT 1
        FROM public.course_discussions cd
        WHERE cd.id = discussion_moderation_reports.target_id
          AND discussion_moderation_reports.target_type = 'discussion'
          AND public.is_course_instructor(cd.course_id, auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.discussion_replies dr
        JOIN public.course_discussions cd
            ON cd.id = dr.discussion_id
        WHERE dr.id = discussion_moderation_reports.target_id
          AND discussion_moderation_reports.target_type = 'reply'
          AND public.is_course_instructor(cd.course_id, auth.uid())
    )
);


-- ============================================================================
-- 18. REALTIME
-- ============================================================================
-- Use only the tables needed by the frontend.
-- Avoid unnecessary REPLICA IDENTITY FULL to reduce payload size.

ALTER TABLE public.course_discussions
REPLICA IDENTITY DEFAULT;

ALTER TABLE public.discussion_replies
REPLICA IDENTITY DEFAULT;

ALTER TABLE public.discussion_reactions
REPLICA IDENTITY DEFAULT;

DO $$
BEGIN

    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN

        BEGIN
            ALTER PUBLICATION supabase_realtime
            ADD TABLE public.course_discussions;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime
            ADD TABLE public.discussion_replies;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime
            ADD TABLE public.discussion_reactions;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

    END IF;

END;
$$;


COMMIT;

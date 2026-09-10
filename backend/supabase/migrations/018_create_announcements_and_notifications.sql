-- ============================================================================
-- EDUSPHERE LMS
-- MIGRATION 018: ANNOUNCEMENTS, ANNOUNCEMENT READS & NOTIFICATIONS
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    message TEXT NOT NULL,

    created_by UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    creator_role TEXT NOT NULL
        CHECK (creator_role IN ('admin', 'instructor')),

    audience TEXT NOT NULL
        CHECK (
            audience IN (
                'Students',
                'Instructors',
                'Both Students & Instructors',
                'Specific Course Students'
            )
        ),

    course_id UUID NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Published')),

    -- NULL while Draft
    -- Set only when announcement becomes Published
    published_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Instructor course announcements must have a course.
    CONSTRAINT chk_course_required_for_course_students
    CHECK (
        audience <> 'Specific Course Students'
        OR course_id IS NOT NULL
    ),

    -- Platform announcements must not have a course.
    CONSTRAINT chk_platform_audience_no_course
    CHECK (
        audience IN (
            'Students',
            'Instructors',
            'Both Students & Instructors'
        )
        OR course_id IS NOT NULL
    )
);

COMMENT ON TABLE public.announcements
IS 'Platform and course announcements for EduSphere LMS';

COMMENT ON COLUMN public.announcements.published_at
IS 'Timestamp when announcement was published. NULL while Draft.';


-- ============================================================================
-- 2. ANNOUNCEMENT READS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    announcement_id UUID NOT NULL
        REFERENCES public.announcements(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_announcement_user_read
        UNIQUE (announcement_id, user_id)
);

COMMENT ON TABLE public.announcement_reads
IS 'Persistent per-user announcement read tracking';


-- ============================================================================
-- 3. NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'info'
        CHECK (
            type IN (
                'info',
                'success',
                'warning',
                'error'
            )
        ),

    category TEXT NOT NULL DEFAULT 'announcement'
        CHECK (
            category IN (
                'announcement',
                'course',
                'assignment',
                'quiz',
                'live_class',
                'chat',
                'payment',
                'system'
            )
        ),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    action_url TEXT NULL,

    -- For announcements this stores announcements.id.
    source_id UUID NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications
IS 'Persistent user notification feed across EduSphere LMS';


-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_announcements_created_by
ON public.announcements(created_by);

CREATE INDEX IF NOT EXISTS idx_announcements_course_id
ON public.announcements(course_id);

CREATE INDEX IF NOT EXISTS idx_announcements_status
ON public.announcements(status);

CREATE INDEX IF NOT EXISTS idx_announcements_audience
ON public.announcements(audience);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
ON public.announcement_reads(user_id, announcement_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_source
ON public.notifications(source_id);


-- ============================================================================
-- 5. ANNOUNCEMENT NOTIFICATION IDEMPOTENCY
-- ============================================================================
-- One announcement can create only ONE notification
-- for the same user.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_notifications_announcement_user_source
ON public.notifications(user_id, source_id)
WHERE category = 'announcement'
  AND source_id IS NOT NULL;


-- ============================================================================
-- 6. UPDATED_AT FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_announcements_updated_at()
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


DROP TRIGGER IF EXISTS trigger_set_announcements_updated_at
ON public.announcements;

CREATE TRIGGER trigger_set_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.set_announcements_updated_at();


CREATE OR REPLACE FUNCTION public.set_notifications_updated_at()
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


DROP TRIGGER IF EXISTS trigger_set_notifications_updated_at
ON public.notifications;

CREATE TRIGGER trigger_set_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_notifications_updated_at();


-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 8. ANNOUNCEMENT ADMIN POLICY
-- ============================================================================

DROP POLICY IF EXISTS
"Admins have full access to announcements"
ON public.announcements;

CREATE POLICY
"Admins have full access to announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'admin'
    )
);


-- ============================================================================
-- 9. INSTRUCTOR ANNOUNCEMENT POLICY
-- ============================================================================
-- Instructor can manage ONLY their own course announcements
-- and ONLY for courses they own.

DROP POLICY IF EXISTS
"Instructors can manage their course announcements"
ON public.announcements;

CREATE POLICY
"Instructors can manage their course announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (
    created_by = auth.uid()
    AND creator_role = 'instructor'
    AND audience = 'Specific Course Students'
    AND course_id IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = public.announcements.course_id
          AND c.instructor_id = auth.uid()
    )
)
WITH CHECK (
    created_by = auth.uid()
    AND creator_role = 'instructor'
    AND audience = 'Specific Course Students'
    AND course_id IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = public.announcements.course_id
          AND c.instructor_id = auth.uid()
    )
);


-- ============================================================================
-- 10. ELIGIBLE USER ANNOUNCEMENT SELECT POLICY
-- ============================================================================

DROP POLICY IF EXISTS
"Users can view eligible published announcements"
ON public.announcements;

CREATE POLICY
"Users can view eligible published announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
    status = 'Published'
    AND
    (
        -- ------------------------------------------------------------
        -- ADMIN → STUDENTS
        -- ------------------------------------------------------------
        (
            audience = 'Students'
            AND creator_role = 'admin'
            AND EXISTS (
                SELECT 1
                FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role::text = 'student'
            )
        )

        OR

        -- ------------------------------------------------------------
        -- ADMIN → INSTRUCTORS
        -- ------------------------------------------------------------
        (
            audience = 'Instructors'
            AND creator_role = 'admin'
            AND EXISTS (
                SELECT 1
                FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role::text = 'instructor'
            )
        )

        OR

        -- ------------------------------------------------------------
        -- ADMIN → BOTH
        -- ------------------------------------------------------------
        (
            audience = 'Both Students & Instructors'
            AND creator_role = 'admin'
            AND EXISTS (
                SELECT 1
                FROM public.profiles p
                WHERE p.id = auth.uid()
                  AND p.role::text IN (
                      'student',
                      'instructor'
                  )
            )
        )

        OR

        -- ------------------------------------------------------------
        -- INSTRUCTOR → SPECIFIC COURSE STUDENTS
        -- ------------------------------------------------------------
        (
            audience = 'Specific Course Students'
            AND creator_role = 'instructor'
            AND course_id IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.enrollments e
                WHERE e.student_id = auth.uid()
                  AND e.course_id = public.announcements.course_id
                  AND e.status::text = 'Active'
            )
        )
    )
);


-- ============================================================================
-- 11. ANNOUNCEMENT READ POLICIES
-- ============================================================================

DROP POLICY IF EXISTS
"Users can view own announcement reads"
ON public.announcement_reads;

CREATE POLICY
"Users can view own announcement reads"
ON public.announcement_reads
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


DROP POLICY IF EXISTS
"Users can insert own announcement reads"
ON public.announcement_reads;

CREATE POLICY
"Users can insert own announcement reads"
ON public.announcement_reads
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);


DROP POLICY IF EXISTS
"Users can update own announcement reads"
ON public.announcement_reads;

CREATE POLICY
"Users can update own announcement reads"
ON public.announcement_reads
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================================
-- 12. NOTIFICATION SELECT POLICY
-- ============================================================================

DROP POLICY IF EXISTS
"Users can view own notifications"
ON public.notifications;

CREATE POLICY
"Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================================
-- 13. NOTIFICATION UPDATE POLICY
-- ============================================================================
-- Used for marking notifications as read.

DROP POLICY IF EXISTS
"Users can update own notifications"
ON public.notifications;

CREATE POLICY
"Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);


-- ============================================================================
-- 14. NOTIFICATION DELETE POLICY
-- ============================================================================

DROP POLICY IF EXISTS
"Users can delete own notifications"
ON public.notifications;

CREATE POLICY
"Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
);


-- ============================================================================
-- 15. REALTIME PUBLICATION
-- ============================================================================

DO $$
BEGIN

    BEGIN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.announcements;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.notifications;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;

END $$;


-- ============================================================================
-- 16. COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.notifications.source_id
IS 'Source record ID. For announcement notifications this references announcements.id.';

COMMENT ON COLUMN public.notifications.category
IS 'Notification category used by the centralized EduSphere notification system.';

COMMENT ON INDEX idx_notifications_announcement_user_source
IS 'Prevents duplicate announcement notifications for the same user and announcement.';


COMMIT;

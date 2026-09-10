-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 015: LIVE CLASSES & LIVE CLASS Q&A
-- ============================================================

BEGIN;

-- ============================================================
-- 1. LIVE CLASSES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.live_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    instructor_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    description TEXT,

    start_time TIMESTAMPTZ NOT NULL,

    end_time TIMESTAMPTZ NOT NULL,

    duration_minutes INTEGER NOT NULL DEFAULT 60
        CHECK (duration_minutes > 0),

    platform TEXT NOT NULL DEFAULT 'Google Meet',

    meeting_url TEXT NOT NULL,

    meeting_id TEXT,

    passcode TEXT,

    status TEXT NOT NULL DEFAULT 'Scheduled'
        CHECK (
            status IN (
                'Draft',
                'Scheduled',
                'Live',
                'Completed',
                'Cancelled'
            )
        ),

    audience_type TEXT NOT NULL DEFAULT 'All Enrolled Students'
        CHECK (
            audience_type IN (
                'All Enrolled Students',
                'Selected Students'
            )
        ),

    selected_student_ids UUID[] NOT NULL DEFAULT '{}',

    instructions TEXT,

    resources JSONB NOT NULL DEFAULT '[]'::jsonb,

    recording_url TEXT,

    is_recording_available BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_live_classes_time_order
        CHECK (end_time > start_time),

    CONSTRAINT chk_live_classes_audience_students
        CHECK (
            (
                audience_type = 'All Enrolled Students'
                AND COALESCE(array_length(selected_student_ids, 1), 0) = 0
            )
            OR
            (
                audience_type = 'Selected Students'
                AND COALESCE(array_length(selected_student_ids, 1), 0) > 0
            )
        ),

    CONSTRAINT chk_live_classes_recording
        CHECK (
            is_recording_available = FALSE
            OR recording_url IS NOT NULL
        )
);


-- ============================================================
-- 2. LIVE CLASS Q&A
-- ============================================================

CREATE TABLE IF NOT EXISTS public.live_class_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    class_id UUID NOT NULL
        REFERENCES public.live_classes(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    question_text TEXT NOT NULL,

    likes_count INTEGER NOT NULL DEFAULT 0
        CHECK (likes_count >= 0),

    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

    is_answered BOOLEAN NOT NULL DEFAULT FALSE,

    instructor_reply TEXT,

    instructor_reply_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_live_classes_course_id
ON public.live_classes(course_id);

CREATE INDEX IF NOT EXISTS idx_live_classes_instructor_id
ON public.live_classes(instructor_id);

CREATE INDEX IF NOT EXISTS idx_live_classes_start_time
ON public.live_classes(start_time);

CREATE INDEX IF NOT EXISTS idx_live_classes_status
ON public.live_classes(status);

CREATE INDEX IF NOT EXISTS idx_live_class_qa_class_id
ON public.live_class_qa(class_id);

CREATE INDEX IF NOT EXISTS idx_live_class_qa_student_id
ON public.live_class_qa(student_id);


-- ============================================================
-- 4. UPDATED_AT TRIGGER — LIVE CLASSES
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_live_classes_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_live_classes_updated_at
ON public.live_classes;

CREATE TRIGGER trigger_set_live_classes_updated_at
BEFORE UPDATE ON public.live_classes
FOR EACH ROW
EXECUTE FUNCTION public.set_live_classes_updated_at();


-- ============================================================
-- 5. UPDATED_AT TRIGGER — Q&A
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_live_class_qa_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_live_class_qa_updated_at
ON public.live_class_qa;

CREATE TRIGGER trigger_set_live_class_qa_updated_at
BEFORE UPDATE ON public.live_class_qa
FOR EACH ROW
EXECUTE FUNCTION public.set_live_class_qa_updated_at();


-- ============================================================
-- 6. ENABLE RLS
-- ============================================================

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.live_class_qa ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 7. ADMIN — LIVE CLASSES
-- ============================================================

DROP POLICY IF EXISTS
"Admins have full access to live_classes"
ON public.live_classes;

CREATE POLICY
"Admins have full access to live_classes"
ON public.live_classes
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


-- ============================================================
-- 8. INSTRUCTOR — OWN LIVE CLASSES ONLY
-- ============================================================

DROP POLICY IF EXISTS
"Instructors can manage own live_classes"
ON public.live_classes;

CREATE POLICY
"Instructors can manage own live_classes"
ON public.live_classes
FOR ALL
TO authenticated
USING (
    instructor_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'instructor'
    )
)
WITH CHECK (
    instructor_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'instructor'
    )
);


-- ============================================================
-- 9. STUDENT — ENROLLED LIVE CLASSES ONLY
-- ============================================================

DROP POLICY IF EXISTS
"Students can view enrolled live_classes"
ON public.live_classes;

CREATE POLICY
"Students can view enrolled live_classes"
ON public.live_classes
FOR SELECT
TO authenticated
USING (
    status <> 'Draft'

    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'student'
    )

    AND EXISTS (
        SELECT 1
        FROM public.enrollments e
        WHERE e.course_id = live_classes.course_id
          AND e.student_id = auth.uid()
          AND e.status <> 'Cancelled'
    )

    AND (
        audience_type = 'All Enrolled Students'

        OR (
            audience_type = 'Selected Students'
            AND auth.uid() = ANY(selected_student_ids)
        )
    )
);


-- ============================================================
-- 10. ADMIN — Q&A
-- ============================================================

DROP POLICY IF EXISTS
"Admins have full access to live_class_qa"
ON public.live_class_qa;

CREATE POLICY
"Admins have full access to live_class_qa"
ON public.live_class_qa
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


-- ============================================================
-- 11. INSTRUCTOR — OWN CLASS Q&A
-- ============================================================

DROP POLICY IF EXISTS
"Instructors can manage QA for own classes"
ON public.live_class_qa;

CREATE POLICY
"Instructors can manage QA for own classes"
ON public.live_class_qa
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.live_classes lc
        JOIN public.profiles p
          ON p.id = auth.uid()
        WHERE lc.id = live_class_qa.class_id
          AND lc.instructor_id = auth.uid()
          AND p.role::text = 'instructor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.live_classes lc
        JOIN public.profiles p
          ON p.id = auth.uid()
        WHERE lc.id = live_class_qa.class_id
          AND lc.instructor_id = auth.uid()
          AND p.role::text = 'instructor'
    )
);


-- ============================================================
-- 12. STUDENT — VIEW Q&A FOR ENROLLED CLASSES
-- ============================================================

DROP POLICY IF EXISTS
"Students can view QA for enrolled classes"
ON public.live_class_qa;

CREATE POLICY
"Students can view QA for enrolled classes"
ON public.live_class_qa
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'student'
    )

    AND EXISTS (
        SELECT 1
        FROM public.live_classes lc
        JOIN public.enrollments e
          ON e.course_id = lc.course_id
        WHERE lc.id = live_class_qa.class_id
          AND e.student_id = auth.uid()
          AND e.status <> 'Cancelled'
          AND (
              lc.audience_type = 'All Enrolled Students'
              OR (
                  lc.audience_type = 'Selected Students'
                  AND auth.uid() = ANY(lc.selected_student_ids)
              )
          )
    )
);


-- ============================================================
-- 13. STUDENT — CREATE Q&A
-- ============================================================

DROP POLICY IF EXISTS
"Students can create QA for enrolled classes"
ON public.live_class_qa;

CREATE POLICY
"Students can create QA for enrolled classes"
ON public.live_class_qa
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()

    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'student'
    )

    AND EXISTS (
        SELECT 1
        FROM public.live_classes lc
        JOIN public.enrollments e
          ON e.course_id = lc.course_id
        WHERE lc.id = live_class_qa.class_id
          AND e.student_id = auth.uid()
          AND e.status <> 'Cancelled'
          AND lc.status <> 'Cancelled'
          AND (
              lc.audience_type = 'All Enrolled Students'
              OR (
                  lc.audience_type = 'Selected Students'
                  AND auth.uid() = ANY(lc.selected_student_ids)
              )
          )
    )
);


-- ============================================================
-- 14. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.live_classes IS
'Persistent EduSphere LMS live classes. Meeting URLs are instructor-provided external meeting links.';

COMMENT ON TABLE public.live_class_qa IS
'Questions submitted by students for authorized live classes.';

COMMENT ON COLUMN public.live_classes.meeting_url IS
'Instructor-provided Google Meet, Zoom, Microsoft Teams, or other valid meeting URL.';

COMMENT ON COLUMN public.live_classes.recording_url IS
'Optional external recording URL. EduSphere does not automatically record meetings.';


-- ============================================================
-- 15. GRANTS
-- ============================================================

GRANT SELECT
ON public.live_classes
TO authenticated;

GRANT SELECT, INSERT
ON public.live_class_qa
TO authenticated;


COMMIT;

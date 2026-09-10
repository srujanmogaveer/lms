-- ============================================================
-- MIGRATION 004
-- EDUSPHERE LMS - CURRICULUM & CONTENT MANAGEMENT
-- ============================================================

-- ============================================================
-- 1. COURSE MODULES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    description TEXT,

    position INTEGER NOT NULL DEFAULT 0
        CHECK (position >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id
ON public.course_modules(course_id);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_position
ON public.course_modules(course_id, position);


-- ============================================================
-- 2. LESSONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_id UUID NOT NULL
        REFERENCES public.course_modules(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    short_description TEXT,

    lesson_type TEXT NOT NULL
        CHECK (
            lesson_type IN (
                'Video',
                'PDF',
                'Text',
                'Resource'
            )
        ),

    content TEXT,

    video_url TEXT,

    document_url TEXT,

    resource_url TEXT,

    duration_minutes INTEGER NOT NULL DEFAULT 0
        CHECK (duration_minutes >= 0),

    position INTEGER NOT NULL DEFAULT 0
        CHECK (position >= 0),

    is_preview BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id
ON public.lessons(module_id);

CREATE INDEX IF NOT EXISTS idx_lessons_module_position
ON public.lessons(module_id, position);


-- ============================================================
-- 3. UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_curriculum_updated_at()
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

DROP TRIGGER IF EXISTS trg_course_modules_updated_at
ON public.course_modules;

CREATE TRIGGER trg_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.set_curriculum_updated_at();

DROP TRIGGER IF EXISTS trg_lessons_updated_at
ON public.lessons;

CREATE TRIGGER trg_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.set_curriculum_updated_at();


-- ============================================================
-- 4. COURSE METRICS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalculate_course_metrics(
    p_course_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.courses
    SET
        lessons_count = (
            SELECT COUNT(l.id)
            FROM public.lessons l
            INNER JOIN public.course_modules cm
                ON cm.id = l.module_id
            WHERE cm.course_id = p_course_id
        ),

        duration_hours = (
            SELECT ROUND(
                COALESCE(SUM(l.duration_minutes), 0)::NUMERIC / 60.0,
                2
            )
            FROM public.lessons l
            INNER JOIN public.course_modules cm
                ON cm.id = l.module_id
            WHERE cm.course_id = p_course_id
        ),

        updated_at = NOW()

    WHERE id = p_course_id;
END;
$$;


-- ============================================================
-- 5. LESSON METRICS TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_lesson_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_new_course_id UUID;
    v_old_course_id UUID;
BEGIN

    IF TG_OP <> 'DELETE' THEN
        SELECT cm.course_id
        INTO v_new_course_id
        FROM public.course_modules cm
        WHERE cm.id = NEW.module_id;
    END IF;

    IF TG_OP <> 'INSERT' THEN
        SELECT cm.course_id
        INTO v_old_course_id
        FROM public.course_modules cm
        WHERE cm.id = OLD.module_id;
    END IF;

    IF v_new_course_id IS NOT NULL THEN
        PERFORM public.recalculate_course_metrics(v_new_course_id);
    END IF;

    IF v_old_course_id IS NOT NULL
       AND v_old_course_id IS DISTINCT FROM v_new_course_id THEN

        PERFORM public.recalculate_course_metrics(v_old_course_id);

    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_course_metrics
ON public.lessons;

CREATE TRIGGER trg_recalculate_course_metrics
AFTER INSERT OR UPDATE OR DELETE
ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.handle_lesson_metrics();


-- ============================================================
-- 6. MODULE DELETE METRICS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_module_delete_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM public.recalculate_course_metrics(OLD.course_id);
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_module_delete_metrics
ON public.course_modules;

CREATE TRIGGER trg_module_delete_metrics
AFTER DELETE
ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.handle_module_delete_metrics();


-- ============================================================
-- 7. ENABLE RLS
-- ============================================================

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. ADMIN - COURSE MODULES
-- ============================================================

DROP POLICY IF EXISTS "Admin full access on course_modules"
ON public.course_modules;

CREATE POLICY "Admin full access on course_modules"
ON public.course_modules
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 9. INSTRUCTOR - COURSE MODULES
-- ============================================================

DROP POLICY IF EXISTS "Instructor manage own course_modules"
ON public.course_modules;

CREATE POLICY "Instructor manage own course_modules"
ON public.course_modules
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE c.id = course_modules.course_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE c.id = course_modules.course_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 10. PUBLIC / STUDENT - COURSE MODULES
-- ============================================================

DROP POLICY IF EXISTS "Public and students can view published course_modules"
ON public.course_modules;

CREATE POLICY "Public and students can view published course_modules"
ON public.course_modules
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_modules.course_id
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
    )
);


-- ============================================================
-- 11. ADMIN - LESSONS
-- ============================================================

DROP POLICY IF EXISTS "Admin full access on lessons"
ON public.lessons;

CREATE POLICY "Admin full access on lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 12. INSTRUCTOR - LESSONS
-- ============================================================

DROP POLICY IF EXISTS "Instructor manage own lessons"
ON public.lessons;

CREATE POLICY "Instructor manage own lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE cm.id = lessons.module_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE cm.id = lessons.module_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 13. PUBLIC / STUDENT - LESSONS
-- ============================================================

DROP POLICY IF EXISTS "Public and students can view published lessons"
ON public.lessons;

CREATE POLICY "Public and students can view published lessons"
ON public.lessons
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        WHERE cm.id = lessons.module_id
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
    )
);


-- ============================================================
-- 14. STORAGE BUCKETS (PRIVATE BUCKETS)
-- ============================================================

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES
(
    'lesson-documents',
    'lesson-documents',
    false,
    26214400,
    ARRAY['application/pdf']
),
(
    'lesson-resources',
    'lesson-resources',
    false,
    52428800,
    NULL
)
ON CONFLICT (id)
DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================================
-- 15. REMOVE OLD STORAGE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Public read lesson documents"
ON storage.objects;

DROP POLICY IF EXISTS "Public read lesson resources"
ON storage.objects;

DROP POLICY IF EXISTS "Instructor upload lesson files"
ON storage.objects;

DROP POLICY IF EXISTS "Instructor update lesson files"
ON storage.objects;

DROP POLICY IF EXISTS "Instructor delete lesson files"
ON storage.objects;

DROP POLICY IF EXISTS "Admin manage lesson files"
ON storage.objects;


-- ============================================================
-- 16. ADMIN STORAGE ACCESS
-- ============================================================

CREATE POLICY "Admin manage lesson files"
ON storage.objects
FOR ALL
TO authenticated
USING (
    public.is_admin()
    AND bucket_id IN (
        'lesson-documents',
        'lesson-resources'
    )
)
WITH CHECK (
    public.is_admin()
    AND bucket_id IN (
        'lesson-documents',
        'lesson-resources'
    )
);


-- ============================================================
-- 17. INSTRUCTOR STORAGE INSERT
--
-- REQUIRED PATH:
-- courseId/moduleId/lessonId/filename
-- ============================================================

CREATE POLICY "Instructor upload lesson files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN (
        'lesson-documents',
        'lesson-resources'
    )
    AND EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE p.id = auth.uid()
          AND p.role = 'instructor'
          AND cm.id::text = split_part(name, '/', 2)
          AND c.id::text = split_part(name, '/', 1)
    )
);


-- ============================================================
-- 18. INSTRUCTOR STORAGE UPDATE
-- ============================================================

CREATE POLICY "Instructor update lesson files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id IN (
        'lesson-documents',
        'lesson-resources'
    )
    AND EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE p.id = auth.uid()
          AND p.role = 'instructor'
          AND cm.id::text = split_part(name, '/', 2)
          AND c.id::text = split_part(name, '/', 1)
    )
)
WITH CHECK (
    bucket_id IN (
        'lesson-documents',
        'lesson-resources'
    )
    AND EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE p.id = c.instructor_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
          AND cm.id::text = split_part(name, '/', 2)
          AND c.id::text = split_part(name, '/', 1)
    )
);


-- ============================================================
-- 19. INSTRUCTOR STORAGE DELETE
-- ============================================================

CREATE POLICY "Instructor delete lesson files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id IN (
        'lesson-documents',
        'lesson-resources'
    )
    AND EXISTS (
        SELECT 1
        FROM public.course_modules cm
        INNER JOIN public.courses c
            ON c.id = cm.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE p.id = auth.uid()
          AND p.role = 'instructor'
          AND cm.id::text = split_part(name, '/', 2)
          AND c.id::text = split_part(name, '/', 1)
    )
);


-- ============================================================
-- 20. STUDENT / PUBLIC STORAGE READ
--
-- Private buckets are used.
-- Backend generates signed URLs after verifying
-- Published + Approved course access.
-- ============================================================

-- No public SELECT policy is created; access is governed securely via signed URLs.


-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

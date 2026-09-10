-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 008: LESSON PROGRESS TABLE & RLS
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CREATE LESSON PROGRESS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    lesson_id UUID NOT NULL
        REFERENCES public.lessons(id)
        ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'In_Progress'
        CHECK (status IN ('In_Progress', 'Completed')),

    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (
            progress_percentage >= 0
            AND progress_percentage <= 100
        ),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_lesson_progress
        UNIQUE (student_id, lesson_id)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id
ON public.lesson_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id
ON public.lesson_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id
ON public.lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_course
ON public.lesson_progress(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_status
ON public.lesson_progress(status);

-- ============================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_lesson_progress_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_lesson_progress_updated_at
ON public.lesson_progress;

CREATE TRIGGER trigger_set_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_lesson_progress_updated_at();

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. STUDENT RLS
-- ============================================================

DROP POLICY IF EXISTS "Students can view own lesson progress"
ON public.lesson_progress;

CREATE POLICY "Students can view own lesson progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can insert own lesson progress"
ON public.lesson_progress;

CREATE POLICY "Students can insert own lesson progress"
ON public.lesson_progress
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can update own lesson progress"
ON public.lesson_progress;

CREATE POLICY "Students can update own lesson progress"
ON public.lesson_progress
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
)
WITH CHECK (
    student_id = auth.uid()
);

-- ============================================================
-- 6. INSTRUCTOR RLS
-- Instructor can view progress only when:
-- 1. Instructor owns the course
-- 2. Student is enrolled in that course
-- ============================================================

DROP POLICY IF EXISTS "Instructors can view lesson progress for own courses"
ON public.lesson_progress;

CREATE POLICY "Instructors can view lesson progress for own courses"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.enrollments e
            ON e.course_id = c.id
        WHERE c.id = lesson_progress.course_id
          AND c.instructor_id = auth.uid()
          AND e.student_id = lesson_progress.student_id
          AND e.status IN ('Active', 'Completed')
    )
);

-- ============================================================
-- 7. ADMIN RLS
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all lesson progress"
ON public.lesson_progress;

CREATE POLICY "Admins can manage all lesson progress"
ON public.lesson_progress
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
    )
);

COMMIT;

-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 005.5 / 005_B: ENROLLMENTS TABLE & RLS
-- (Must be executed before Migration 006 Quizzes)
-- ============================================================

-- ============================================================
-- 1. ENROLLMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'Active'
        CHECK (
            status IN (
                'Active',
                'Completed',
                'Cancelled'
            )
        ),

    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_course_enrollment
        UNIQUE (student_id, course_id)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id
ON public.enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status
ON public.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_course
ON public.enrollments(student_id, course_id);


-- ============================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_enrollment_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_enrollments_updated_at
ON public.enrollments;

CREATE TRIGGER trigger_set_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_enrollment_updated_at();


-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Students can view own enrollments"
ON public.enrollments;

DROP POLICY IF EXISTS "Instructors can view own course enrollments"
ON public.enrollments;

DROP POLICY IF EXISTS "Admins have full access to enrollments"
ON public.enrollments;


-- 5.1 Student Policy
-- A student can view their own enrollment records.
CREATE POLICY "Students can view own enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);


-- 5.2 Instructor Policy
-- An instructor can view enrollments for courses they own.
CREATE POLICY "Instructors can view own course enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE c.id = public.enrollments.course_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- 5.3 Admin Policy
-- Admin has full access to enrollments.
CREATE POLICY "Admins have full access to enrollments"
ON public.enrollments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'::user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'::user_role
    )
);

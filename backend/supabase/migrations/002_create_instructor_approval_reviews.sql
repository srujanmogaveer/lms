-- Migration: 002_create_instructor_approval_reviews.sql

CREATE TABLE IF NOT EXISTS public.instructor_approval_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    instructor_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    reviewed_by UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    previous_status instructor_approval_status NOT NULL,
    new_status instructor_approval_status NOT NULL,

    rejection_reason TEXT,

    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_rejection_reason CHECK (
        new_status <> 'rejected'
        OR NULLIF(TRIM(rejection_reason), '') IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_approval_reviews_instructor
    ON public.instructor_approval_reviews(instructor_id);

CREATE INDEX IF NOT EXISTS idx_approval_reviews_reviewer
    ON public.instructor_approval_reviews(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_approval_reviews_date
    ON public.instructor_approval_reviews(reviewed_at DESC);

ALTER TABLE public.instructor_approval_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage approval reviews"
ON public.instructor_approval_reviews;

CREATE POLICY "Admins can manage approval reviews"
ON public.instructor_approval_reviews
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

DROP POLICY IF EXISTS "Instructors can view own approval history"
ON public.instructor_approval_reviews;

CREATE POLICY "Instructors can view own approval history"
ON public.instructor_approval_reviews
FOR SELECT
TO authenticated
USING (
    instructor_id = auth.uid()
);

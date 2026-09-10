-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 021: COURSE REVIEWS & RATINGS SYSTEM
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review_title TEXT,
    review_text TEXT NOT NULL,
    helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_course_review UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_student ON public.course_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON public.course_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_course_reviews_created ON public.course_reviews(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_course_reviews_updated_at ON public.course_reviews;
CREATE TRIGGER set_course_reviews_updated_at
BEFORE UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger function to recalculate course rating and instructor rating
CREATE OR REPLACE FUNCTION public.recalculate_course_and_instructor_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_course_id UUID;
    target_instructor_id UUID;
    v_avg_rating NUMERIC(3, 2);
    v_reviews_count INTEGER;
    v_instructor_avg NUMERIC(3, 2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_course_id := OLD.course_id;
    ELSE
        target_course_id := NEW.course_id;
    END IF;

    -- 1. Calculate new average rating and review count for the course
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 2), 5.00),
        COUNT(*)::integer
    INTO 
        v_avg_rating,
        v_reviews_count
    FROM public.course_reviews
    WHERE course_id = target_course_id;

    -- 2. Update the courses table
    UPDATE public.courses
    SET 
        rating = v_avg_rating,
        reviews_count = v_reviews_count,
        updated_at = NOW()
    WHERE id = target_course_id
    RETURNING instructor_id INTO target_instructor_id;

    -- 3. If instructor exists, update the instructor's aggregate rating
    IF target_instructor_id IS NOT NULL THEN
        SELECT 
            COALESCE(ROUND(AVG(rating)::numeric, 2), 5.00)
        INTO 
            v_instructor_avg
        FROM public.courses
        WHERE instructor_id = target_instructor_id
          AND reviews_count > 0;

        IF v_instructor_avg IS NULL THEN
            v_instructor_avg := 5.00;
        END IF;

        UPDATE public.profiles
        SET 
            instructor_rating = v_instructor_avg,
            updated_at = NOW()
        WHERE id = target_instructor_id;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_reviews_recalculate ON public.course_reviews;
CREATE TRIGGER trg_course_reviews_recalculate
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_course_and_instructor_ratings();

-- Row Level Security (RLS)
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view course reviews" ON public.course_reviews;
CREATE POLICY "Public can view course reviews" 
ON public.course_reviews FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Enrolled students can insert reviews" ON public.course_reviews;
CREATE POLICY "Enrolled students can insert reviews" 
ON public.course_reviews FOR INSERT 
TO authenticated 
WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = auth.uid()
          AND e.course_id = course_reviews.course_id
    )
);

DROP POLICY IF EXISTS "Students can update own reviews" ON public.course_reviews;
CREATE POLICY "Students can update own reviews" 
ON public.course_reviews FOR UPDATE 
TO authenticated 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students or Admins can delete reviews" ON public.course_reviews;
CREATE POLICY "Students or Admins can delete reviews" 
ON public.course_reviews FOR DELETE 
TO authenticated 
USING (
    student_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_reviews TO authenticated;
GRANT SELECT ON public.course_reviews TO anon;

COMMIT;

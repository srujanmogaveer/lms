-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 009: WISHLISTS & CART_ITEMS
-- DATABASE + RLS
-- ============================================================

BEGIN;

-- ============================================================
-- 1. WISHLISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_wishlist_course
        UNIQUE (student_id, course_id)
);

-- ============================================================
-- 2. CART ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_student_cart_course
        UNIQUE (student_id, course_id)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wishlists_student_id
ON public.wishlists(student_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_course_id
ON public.wishlists(course_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_student_course
ON public.wishlists(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_student_id
ON public.cart_items(student_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_course_id
ON public.cart_items(course_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_student_course
ON public.cart_items(student_id, course_id);

-- ============================================================
-- 4. CART UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_cart_items_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_cart_items_updated_at
ON public.cart_items;

CREATE TRIGGER trigger_set_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.set_cart_items_updated_at();

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. WISHLIST POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Students can view own wishlist"
ON public.wishlists;

CREATE POLICY "Students can view own wishlist"
ON public.wishlists
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can insert own wishlist"
ON public.wishlists;

CREATE POLICY "Students can insert own wishlist"
ON public.wishlists
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can delete own wishlist"
ON public.wishlists;

CREATE POLICY "Students can delete own wishlist"
ON public.wishlists
FOR DELETE
TO authenticated
USING (
    student_id = auth.uid()
);

-- ============================================================
-- 7. CART POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Students can view own cart items"
ON public.cart_items;

CREATE POLICY "Students can view own cart items"
ON public.cart_items
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can insert own cart items"
ON public.cart_items;

CREATE POLICY "Students can insert own cart items"
ON public.cart_items
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can delete own cart items"
ON public.cart_items;

CREATE POLICY "Students can delete own cart items"
ON public.cart_items
FOR DELETE
TO authenticated
USING (
    student_id = auth.uid()
);

-- ============================================================
-- 8. STUDENT UPDATE POLICY FOR CART
-- ============================================================

DROP POLICY IF EXISTS "Students can update own cart items"
ON public.cart_items;

CREATE POLICY "Students can update own cart items"
ON public.cart_items
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
)
WITH CHECK (
    student_id = auth.uid()
);

COMMIT;

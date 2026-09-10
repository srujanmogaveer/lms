-- Migration: 003_create_categories_and_courses.sql
-- Description:
-- Creates Categories, Courses and Course Approval Reviews
-- using the existing EduSphere profiles architecture.
--
-- Existing authentication architecture:
-- auth.users.id
--      ↓
-- profiles.id
--      ↓
-- courses.instructor_id
--
-- Student:
-- Email/password + Google/Gmail
--
-- Instructor:
-- Email/password only
--
-- Admin:
-- Existing Admin authentication
--
-- No shared-email/family-account functionality is implemented.

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    slug TEXT NOT NULL UNIQUE,

    description TEXT NOT NULL,

    image_url TEXT DEFAULT
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',

    status TEXT NOT NULL DEFAULT 'Active'
        CHECK (status IN ('Active', 'Inactive')),

    subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug
ON public.categories(slug);

CREATE INDEX IF NOT EXISTS idx_categories_status
ON public.categories(status);


-- ============================================================================
-- 2. COURSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ------------------------------------------------------------------------
    -- Relationships
    -- ------------------------------------------------------------------------

    instructor_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    category_id UUID
        REFERENCES public.categories(id)
        ON DELETE SET NULL,

    subcategory TEXT,

    -- ------------------------------------------------------------------------
    -- Course Information
    -- ------------------------------------------------------------------------

    title TEXT NOT NULL,

    slug TEXT NOT NULL UNIQUE,

    short_description TEXT,

    full_description TEXT,

    difficulty TEXT NOT NULL DEFAULT 'Beginner'
        CHECK (
            difficulty IN (
                'Beginner',
                'Intermediate',
                'Advanced',
                'All Levels'
            )
        ),

    language TEXT NOT NULL DEFAULT 'English'
        CHECK (
            language IN (
                'English',
                'Hindi',
                'Kannada',
                'Tamil',
                'Telugu',
                'Bengali',
                'Marathi'
            )
        ),

    thumbnail TEXT NOT NULL DEFAULT
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',

    promo_video_url TEXT,

    -- ------------------------------------------------------------------------
    -- Pricing
    -- ------------------------------------------------------------------------

    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00
        CHECK (price >= 0),

    discount_price NUMERIC(10, 2)
        CHECK (
            discount_price IS NULL
            OR (
                discount_price >= 0
                AND discount_price <= price
            )
        ),

    price_type TEXT NOT NULL DEFAULT 'Free'
        CHECK (
            price_type IN (
                'Free',
                'Paid',
                'Discounted'
            )
        ),

    -- ------------------------------------------------------------------------
    -- Course Status & Approval Workflow
    --
    -- New course:
    -- course_status = Draft
    -- approval_status = Draft
    --
    -- Submit:
    -- course_status = Draft
    -- approval_status = Pending Approval
    --
    -- Approve:
    -- course_status = Published
    -- approval_status = Approved
    --
    -- Reject:
    -- course_status = Draft
    -- approval_status = Rejected
    -- ------------------------------------------------------------------------

    course_status TEXT NOT NULL DEFAULT 'Draft'
        CHECK (
            course_status IN (
                'Draft',
                'Published',
                'Archived'
            )
        ),

    approval_status TEXT NOT NULL DEFAULT 'Draft'
        CHECK (
            approval_status IN (
                'Draft',
                'Pending Approval',
                'Approved',
                'Rejected',
                'Archived'
            )
        ),

    rejection_reason TEXT,

    -- ------------------------------------------------------------------------
    -- Course Metadata
    -- ------------------------------------------------------------------------

    tags TEXT[] NOT NULL DEFAULT '{}'::text[],

    requirements TEXT[] NOT NULL DEFAULT '{}'::text[],

    learning_outcomes TEXT[] NOT NULL DEFAULT '{}'::text[],

    -- ------------------------------------------------------------------------
    -- Calculated / Aggregate Fields
    -- These must not be directly modified by instructors.
    -- ------------------------------------------------------------------------

    duration_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.00
        CHECK (duration_hours >= 0),

    lessons_count INTEGER NOT NULL DEFAULT 0
        CHECK (lessons_count >= 0),

    assignments_count INTEGER NOT NULL DEFAULT 0
        CHECK (assignments_count >= 0),

    quizzes_count INTEGER NOT NULL DEFAULT 0
        CHECK (quizzes_count >= 0),

    students_enrolled INTEGER NOT NULL DEFAULT 0
        CHECK (students_enrolled >= 0),

    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00
        CHECK (
            rating >= 0.00
            AND rating <= 5.00
        ),

    reviews_count INTEGER NOT NULL DEFAULT 0
        CHECK (reviews_count >= 0),

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    -- ------------------------------------------------------------------------
    -- Timestamps
    -- ------------------------------------------------------------------------

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 3. COURSE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id
ON public.courses(instructor_id);

CREATE INDEX IF NOT EXISTS idx_courses_category_id
ON public.courses(category_id);

CREATE INDEX IF NOT EXISTS idx_courses_slug
ON public.courses(slug);

CREATE INDEX IF NOT EXISTS idx_courses_status_approval
ON public.courses(course_status, approval_status);

CREATE INDEX IF NOT EXISTS idx_courses_price
ON public.courses(price);

CREATE INDEX IF NOT EXISTS idx_courses_rating
ON public.courses(rating DESC);


-- ============================================================================
-- 4. COURSE APPROVAL REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.course_approval_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    reviewed_by UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    previous_status TEXT NOT NULL,

    new_status TEXT NOT NULL,

    feedback TEXT,

    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course
ON public.course_approval_reviews(course_id);

CREATE INDEX IF NOT EXISTS idx_course_reviews_reviewer
ON public.course_approval_reviews(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_course_reviews_date
ON public.course_approval_reviews(reviewed_at DESC);


-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_categories_updated_at
ON public.categories;

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


DROP TRIGGER IF EXISTS set_courses_updated_at
ON public.courses;

CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 6. AUTHENTICATED PROFILE HELPER
-- ============================================================================
--
-- Existing architecture:
-- profiles.id = auth.uid()
--
-- Only return the profile if the authenticated user has the requested role.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_profile_id(
    required_role user_role
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT p.id
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = required_role
    LIMIT 1;
$$;


-- ============================================================================
-- 7. ENABLE RLS
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.course_approval_reviews ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 8. CATEGORY RLS
-- ============================================================================

DROP POLICY IF EXISTS "Categories select policy"
ON public.categories;

CREATE POLICY "Categories select policy"
ON public.categories
FOR SELECT
USING (true);


DROP POLICY IF EXISTS "Categories admin write policy"
ON public.categories;

CREATE POLICY "Categories admin write policy"
ON public.categories
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================================
-- 9. COURSE SELECT RLS
-- ============================================================================

DROP POLICY IF EXISTS "Courses select policy"
ON public.courses;

CREATE POLICY "Courses select policy"
ON public.courses
FOR SELECT
USING (

    -- Public / Students:
    -- Only published + approved courses
    (
        course_status = 'Published'
        AND approval_status = 'Approved'
    )

    OR

    -- Admin:
    -- Can view all courses
    public.is_admin()

    OR

    -- Instructor:
    -- Can view their own courses
    instructor_id = public.get_auth_profile_id('instructor')
);


-- ============================================================================
-- 10. COURSE INSERT RLS
-- ============================================================================

DROP POLICY IF EXISTS "Courses insert policy"
ON public.courses;

CREATE POLICY "Courses insert policy"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (

    -- Admin can create any course
    public.is_admin()

    OR

    (
        -- Instructor must own the course
        instructor_id = public.get_auth_profile_id('instructor')

        -- New courses must start as Draft
        AND course_status = 'Draft'

        -- Approval must start as Draft
        AND approval_status = 'Draft'
    )
);


-- ============================================================================
-- 11. COURSE UPDATE RLS
-- ============================================================================
--
-- Instructors:
-- - Can update their own course
-- - Cannot change instructor_id
-- - Cannot change approval_status
-- - Cannot change rejection_reason
-- - Cannot modify calculated fields
--
-- Admin:
-- - Can update any course
-- ============================================================================

DROP POLICY IF EXISTS "Courses update policy"
ON public.courses;

CREATE POLICY "Courses update policy"
ON public.courses
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR instructor_id = public.get_auth_profile_id('instructor')
)
WITH CHECK (

    public.is_admin()

    OR
    (
        instructor_id = public.get_auth_profile_id('instructor')

        -- Ownership cannot change
        AND instructor_id = (
            SELECT old_course.instructor_id
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        -- Approval status cannot be changed by instructor
        AND approval_status = (
            SELECT old_course.approval_status
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        -- Rejection reason cannot be changed by instructor
        AND rejection_reason IS NOT DISTINCT FROM (
            SELECT old_course.rejection_reason
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        -- Calculated fields cannot be changed by instructor
        AND duration_hours = (
            SELECT old_course.duration_hours
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        AND lessons_count = (
            SELECT old_course.lessons_count
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        AND assignments_count = (
            SELECT old_course.assignments_count
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        AND quizzes_count = (
            SELECT old_course.quizzes_count
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        AND students_enrolled = (
            SELECT old_course.students_enrolled
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        AND rating = (
            SELECT old_course.rating
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )

        AND reviews_count = (
            SELECT old_course.reviews_count
            FROM public.courses old_course
            WHERE old_course.id = public.courses.id
        )
    )
);


-- ============================================================================
-- 12. COURSE DELETE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Courses delete policy"
ON public.courses;

CREATE POLICY "Courses delete policy"
ON public.courses
FOR DELETE
TO authenticated
USING (

    -- Admin can delete any course
    public.is_admin()

    OR

    (
        -- Instructor can delete only own Draft/Archived courses
        instructor_id = public.get_auth_profile_id('instructor')
        AND course_status IN ('Draft', 'Archived')
    )
);


-- ============================================================================
-- 13. COURSE APPROVAL REVIEW RLS
-- ============================================================================

DROP POLICY IF EXISTS "Approval reviews admin policy"
ON public.course_approval_reviews;

CREATE POLICY "Approval reviews admin policy"
ON public.course_approval_reviews
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


DROP POLICY IF EXISTS "Approval reviews instructor view policy"
ON public.course_approval_reviews;

CREATE POLICY "Approval reviews instructor view policy"
ON public.course_approval_reviews
FOR SELECT
TO authenticated
USING (
    course_id IN (
        SELECT c.id
        FROM public.courses c
        WHERE c.instructor_id =
            public.get_auth_profile_id('instructor')
    )
);

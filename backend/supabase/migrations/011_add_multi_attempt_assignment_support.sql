-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 011: MULTI-ATTEMPT ASSIGNMENT SUPPORT
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ADD max_attempts TO ASSIGNMENTS
-- ============================================================

ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS max_attempts INTEGER;

-- Set existing NULL values to the default
UPDATE public.assignments
SET max_attempts = 3
WHERE max_attempts IS NULL;

-- Set default for future assignments
ALTER TABLE public.assignments
ALTER COLUMN max_attempts SET DEFAULT 3;

-- Make sure every assignment has a valid value
ALTER TABLE public.assignments
ALTER COLUMN max_attempts SET NOT NULL;

-- Remove old validation constraint if it already exists
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS valid_assignment_max_attempts;

-- Add validation
ALTER TABLE public.assignments
ADD CONSTRAINT valid_assignment_max_attempts
CHECK (max_attempts >= 1);


-- ============================================================
-- 2. ADD attempt_number TO ASSIGNMENT_SUBMISSIONS
-- ============================================================

ALTER TABLE public.assignment_submissions
ADD COLUMN IF NOT EXISTS attempt_number INTEGER;

-- Existing submissions become Attempt 1
UPDATE public.assignment_submissions
SET attempt_number = 1
WHERE attempt_number IS NULL;

-- Default for new submissions
ALTER TABLE public.assignment_submissions
ALTER COLUMN attempt_number SET DEFAULT 1;

-- Existing records have now been populated
ALTER TABLE public.assignment_submissions
ALTER COLUMN attempt_number SET NOT NULL;

-- Remove old validation constraint if present
ALTER TABLE public.assignment_submissions
DROP CONSTRAINT IF EXISTS valid_submission_attempt_number;

-- Validate attempt number
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT valid_submission_attempt_number
CHECK (attempt_number >= 1);


-- ============================================================
-- 3. REMOVE OLD SINGLE-ATTEMPT UNIQUE CONSTRAINT
-- ============================================================

-- The old constraint may have a different name.
-- Find and remove any UNIQUE constraint containing:
-- assignment_id + student_id
-- but NOT the new attempt-based constraint.

DO $$
DECLARE
    constraint_record RECORD;
BEGIN

    FOR constraint_record IN
        SELECT
            c.conname
        FROM pg_constraint c
        WHERE c.conrelid = 'public.assignment_submissions'::regclass
          AND c.contype = 'u'
          AND c.conname <> 'unique_assignment_student_attempt'
          AND (
              SELECT array_agg(a.attname ORDER BY a.attnum)
              FROM pg_attribute a
              WHERE a.attrelid = c.conrelid
                AND a.attnum = ANY(c.conkey)
                AND a.attnum > 0
          ) = ARRAY['assignment_id', 'student_id']::name[]
    LOOP

        EXECUTE format(
            'ALTER TABLE public.assignment_submissions DROP CONSTRAINT %I',
            constraint_record.conname
        );

    END LOOP;

END $$;


-- ============================================================
-- 4. CREATE MULTI-ATTEMPT UNIQUE CONSTRAINT
-- ============================================================

ALTER TABLE public.assignment_submissions
DROP CONSTRAINT IF EXISTS unique_assignment_student_attempt;

ALTER TABLE public.assignment_submissions
ADD CONSTRAINT unique_assignment_student_attempt
UNIQUE (
    assignment_id,
    student_id,
    attempt_number
);


-- ============================================================
-- 5. INDEX FOR ATTEMPT LOOKUPS
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_assignment_submissions_student_assignment_attempt
ON public.assignment_submissions (
    assignment_id,
    student_id,
    attempt_number
);


-- ============================================================
-- 6. INDEX FOR STUDENT ATTEMPT HISTORY
-- ============================================================

CREATE INDEX IF NOT EXISTS
idx_assignment_submissions_student_attempt
ON public.assignment_submissions (
    student_id,
    assignment_id,
    attempt_number
);


COMMIT;

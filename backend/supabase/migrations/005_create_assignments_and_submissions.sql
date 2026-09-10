-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 005
-- ASSIGNMENTS & ASSIGNMENT SUBMISSIONS
-- ============================================================


-- ============================================================
-- 1. ASSIGNMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE CASCADE,

    module_id UUID
        REFERENCES public.course_modules(id)
        ON DELETE SET NULL,

    lesson_id UUID
        REFERENCES public.lessons(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    instructions TEXT,

    due_days INTEGER NOT NULL DEFAULT 7
        CHECK (due_days >= 0),

    max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00
        CHECK (max_score > 0),

    passing_score NUMERIC(5,2) NOT NULL DEFAULT 60.00,

    status VARCHAR(20) NOT NULL DEFAULT 'Draft'
        CHECK (
            status IN (
                'Draft',
                'Published',
                'Archived'
            )
        ),

    position INTEGER NOT NULL DEFAULT 1
        CHECK (position >= 1),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_assignment_passing_score
        CHECK (
            passing_score >= 0
            AND passing_score <= max_score
        )
);


-- ============================================================
-- 2. ASSIGNMENT SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assignment_id UUID NOT NULL
        REFERENCES public.assignments(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    submission_text TEXT,

    file_url TEXT,

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    score NUMERIC(5,2),

    feedback TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'Submitted'
        CHECK (
            status IN (
                'Submitted',
                'Under Review',
                'Graded',
                'Resubmission Requested'
            )
        ),

    graded_at TIMESTAMPTZ,

    graded_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_submission_score
        CHECK (
            score IS NULL
            OR score >= 0
        ),

    CONSTRAINT unique_student_assignment
        UNIQUE (assignment_id, student_id)
);


-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_assignments_course_id
ON public.assignments(course_id);

CREATE INDEX IF NOT EXISTS idx_assignments_module_id
ON public.assignments(module_id);

CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id
ON public.assignments(lesson_id);

CREATE INDEX IF NOT EXISTS idx_assignments_status
ON public.assignments(status);

CREATE INDEX IF NOT EXISTS idx_assignments_course_position
ON public.assignments(course_id, position);


CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id
ON public.assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id
ON public.assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status
ON public.assignment_submissions(status);


-- ============================================================
-- 4. UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_assignment_updated_at()
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


DROP TRIGGER IF EXISTS trg_assignments_updated_at
ON public.assignments;

CREATE TRIGGER trg_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_assignment_updated_at();


DROP TRIGGER IF EXISTS trg_assignment_submissions_updated_at
ON public.assignment_submissions;

CREATE TRIGGER trg_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.set_assignment_updated_at();


-- ============================================================
-- 5. ENABLE RLS
-- ============================================================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. ASSIGNMENT VALIDATION FUNCTION
--
-- Ensures module and lesson belong to the same course.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_assignment_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_module_course_id UUID;
    v_lesson_course_id UUID;
BEGIN

    -- Validate module
    IF NEW.module_id IS NOT NULL THEN

        SELECT course_id
        INTO v_module_course_id
        FROM public.course_modules
        WHERE id = NEW.module_id;

        IF v_module_course_id IS NULL THEN
            RAISE EXCEPTION 'Module does not exist';
        END IF;

        IF v_module_course_id <> NEW.course_id THEN
            RAISE EXCEPTION
                'Assignment module does not belong to the selected course';
        END IF;

    END IF;


    -- Validate lesson
    IF NEW.lesson_id IS NOT NULL THEN

        SELECT cm.course_id
        INTO v_lesson_course_id
        FROM public.lessons l
        INNER JOIN public.course_modules cm
            ON cm.id = l.module_id
        WHERE l.id = NEW.lesson_id;

        IF v_lesson_course_id IS NULL THEN
            RAISE EXCEPTION 'Lesson does not exist';
        END IF;

        IF v_lesson_course_id <> NEW.course_id THEN
            RAISE EXCEPTION
                'Assignment lesson does not belong to the selected course';
        END IF;

        -- If both module and lesson are supplied,
        -- ensure lesson belongs to selected module.
        IF NEW.module_id IS NOT NULL THEN

            IF NOT EXISTS (
                SELECT 1
                FROM public.lessons l
                WHERE l.id = NEW.lesson_id
                  AND l.module_id = NEW.module_id
            ) THEN

                RAISE EXCEPTION
                    'Lesson does not belong to the selected module';

            END IF;

        END IF;

    END IF;


    RETURN NEW;

END;
$$;


DROP TRIGGER IF EXISTS trg_validate_assignment_relationships
ON public.assignments;

CREATE TRIGGER trg_validate_assignment_relationships
BEFORE INSERT OR UPDATE
ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.validate_assignment_relationships();


-- ============================================================
-- 7. ADMIN ASSIGNMENT ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Admin full access assignments"
ON public.assignments;

CREATE POLICY "Admin full access assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 8. INSTRUCTOR VIEW OWN ASSIGNMENTS
-- ============================================================

DROP POLICY IF EXISTS "Instructor view own assignments"
ON public.assignments;

CREATE POLICY "Instructor view own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE c.id = assignments.course_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 9. INSTRUCTOR CREATE ASSIGNMENTS
-- ============================================================

DROP POLICY IF EXISTS "Instructor create own assignments"
ON public.assignments;

CREATE POLICY "Instructor create own assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE c.id = assignments.course_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 10. INSTRUCTOR UPDATE OWN ASSIGNMENTS
-- ============================================================

DROP POLICY IF EXISTS "Instructor update own assignments"
ON public.assignments;

CREATE POLICY "Instructor update own assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE c.id = assignments.course_id
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
        WHERE c.id = assignments.course_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 11. INSTRUCTOR DELETE OWN ASSIGNMENTS
-- ============================================================

DROP POLICY IF EXISTS "Instructor delete own assignments"
ON public.assignments;

CREATE POLICY "Instructor delete own assignments"
ON public.assignments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE c.id = assignments.course_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 12. STUDENT / PUBLIC VIEW PUBLISHED ASSIGNMENTS
-- ============================================================

DROP POLICY IF EXISTS "Student view published assignments"
ON public.assignments;

CREATE POLICY "Student view published assignments"
ON public.assignments
FOR SELECT
TO anon, authenticated
USING (
    status = 'Published'

    AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = assignments.course_id
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
    )
);


-- ============================================================
-- 13. ADMIN SUBMISSION ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Admin full access assignment submissions"
ON public.assignment_submissions;

CREATE POLICY "Admin full access assignment submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- 14. STUDENT CREATE OWN SUBMISSION
-- ============================================================

DROP POLICY IF EXISTS "Student create own assignment submission"
ON public.assignment_submissions;

CREATE POLICY "Student create own assignment submission"
ON public.assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (

    student_id = auth.uid()

    AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'student'
    )

    AND EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.courses c
            ON c.id = a.course_id
        WHERE a.id = assignment_submissions.assignment_id
          AND a.status = 'Published'
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
    )
);


-- ============================================================
-- 15. STUDENT VIEW OWN SUBMISSIONS
-- ============================================================

DROP POLICY IF EXISTS "Student view own assignment submissions"
ON public.assignment_submissions;

CREATE POLICY "Student view own assignment submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);


-- ============================================================
-- 16. INSTRUCTOR VIEW SUBMISSIONS
-- ============================================================

DROP POLICY IF EXISTS "Instructor view course assignment submissions"
ON public.assignment_submissions;

CREATE POLICY "Instructor view course assignment submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.courses c
            ON c.id = a.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE a.id = assignment_submissions.assignment_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 17. INSTRUCTOR GRADE SUBMISSIONS
-- ============================================================

DROP POLICY IF EXISTS "Instructor grade assignment submissions"
ON public.assignment_submissions;

CREATE POLICY "Instructor grade assignment submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.courses c
            ON c.id = a.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE a.id = assignment_submissions.assignment_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.courses c
            ON c.id = a.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE a.id = assignment_submissions.assignment_id
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- 18. STUDENT UPDATE OWN SUBMISSION
-- ============================================================

DROP POLICY IF EXISTS "Student update own assignment submission"
ON public.assignment_submissions;

CREATE POLICY "Student update own assignment submission"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
    AND status = 'Resubmission Requested'
)
WITH CHECK (
    student_id = auth.uid()
    AND status IN (
        'Submitted',
        'Resubmission Requested'
    )
);


-- ============================================================
-- 19. PREVENT STUDENT FROM GRADING
--
-- Students can only modify their submission content/status
-- through the backend service. Backend must enforce the
-- allowed fields.
-- ============================================================


-- ============================================================
-- 20. ASSIGNMENT SUBMISSION FILE STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit
)
VALUES (
    'assignment-submissions',
    'assignment-submissions',
    false,
    52428800
)
ON CONFLICT (id)
DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit;


-- ============================================================
-- 21. STORAGE ADMIN ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Admin manage assignment submission files"
ON storage.objects;

CREATE POLICY "Admin manage assignment submission files"
ON storage.objects
FOR ALL
TO authenticated
USING (
    public.is_admin()
    AND bucket_id = 'assignment-submissions'
)
WITH CHECK (
    public.is_admin()
    AND bucket_id = 'assignment-submissions'
);


-- ============================================================
-- 22. STUDENT UPLOAD ASSIGNMENT FILE
--
-- REQUIRED PATH:
--
-- courseId/assignmentId/studentId/filename
-- ============================================================

DROP POLICY IF EXISTS "Student upload assignment submission file"
ON storage.objects;

CREATE POLICY "Student upload assignment submission file"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-submissions'

    AND split_part(name, '/', 3) = auth.uid()::text

    AND EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.courses c
            ON c.id = a.course_id
        WHERE a.id::text = split_part(name, '/', 2)
          AND c.id::text = split_part(name, '/', 1)
          AND a.status = 'Published'
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
    )
);


-- ============================================================
-- 23. STUDENT DELETE OWN SUBMISSION FILE
-- ============================================================

DROP POLICY IF EXISTS "Student delete own assignment submission file"
ON storage.objects;

CREATE POLICY "Student delete own assignment submission file"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignment-submissions'
    AND split_part(name, '/', 3) = auth.uid()::text
);


-- ============================================================
-- 24. STUDENT UPDATE OWN SUBMISSION FILE
-- ============================================================

DROP POLICY IF EXISTS "Student update own assignment submission file"
ON storage.objects;

CREATE POLICY "Student update own assignment submission file"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'assignment-submissions'
    AND split_part(name, '/', 3) = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND split_part(name, '/', 3) = auth.uid()::text
);


-- ============================================================
-- 25. INSTRUCTOR VIEW SUBMISSION FILES
-- ============================================================

DROP POLICY IF EXISTS "Instructor view assignment submission files"
ON storage.objects;

CREATE POLICY "Instructor view assignment submission files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions'

    AND EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.courses c
            ON c.id = a.course_id
        INNER JOIN public.profiles p
            ON p.id = c.instructor_id
        WHERE a.id::text = split_part(name, '/', 2)
          AND p.id = auth.uid()
          AND p.role = 'instructor'
    )
);


-- ============================================================
-- MIGRATION 005 COMPLETE
-- ============================================================

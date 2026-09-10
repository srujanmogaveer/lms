-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 006
-- QUIZZES, QUESTIONS, ATTEMPTS, ANSWERS & REATTEMPT REQUESTS
-- ============================================================

-- ============================================================
-- 1. QUIZZES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
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

    time_limit_minutes INTEGER NOT NULL DEFAULT 15
        CHECK (time_limit_minutes >= 0),

    passing_score NUMERIC(5,2) NOT NULL DEFAULT 70.00
        CHECK (passing_score >= 0 AND passing_score <= 100),

    quiz_type TEXT NOT NULL DEFAULT 'Mandatory'
        CHECK (quiz_type IN ('Mandatory', 'Optional')),

    max_attempts INTEGER NOT NULL DEFAULT 3
        CHECK (max_attempts >= 1),

    randomize_questions BOOLEAN NOT NULL DEFAULT TRUE,

    shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,

    status TEXT NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Published', 'Archived')),

    position INTEGER NOT NULL DEFAULT 1
        CHECK (position >= 1),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id
ON public.quizzes(course_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_module_id
ON public.quizzes(module_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id
ON public.quizzes(lesson_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_status
ON public.quizzes(status);

CREATE INDEX IF NOT EXISTS idx_quizzes_position
ON public.quizzes(course_id, position);


-- ============================================================
-- 2. QUIZ QUESTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quiz_id UUID NOT NULL
        REFERENCES public.quizzes(id)
        ON DELETE CASCADE,

    question_text TEXT NOT NULL,

    question_type TEXT NOT NULL
        CHECK (
            question_type IN (
                'Single Answer',
                'Multiple Answer',
                'Fill in the Blanks',
                'True or False'
            )
        ),

    options JSONB NOT NULL DEFAULT '[]'::jsonb,

    correct_answer JSONB,

    points NUMERIC(5,2) NOT NULL DEFAULT 10.00
        CHECK (points > 0),

    explanation TEXT,

    position INTEGER NOT NULL DEFAULT 1
        CHECK (position >= 1),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id
ON public.quiz_questions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_position
ON public.quiz_questions(quiz_id, position);


-- ============================================================
-- 3. QUIZ ATTEMPTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quiz_id UUID NOT NULL
        REFERENCES public.quizzes(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    submitted_at TIMESTAMPTZ,

    score NUMERIC(5,2) NOT NULL DEFAULT 0.00,

    total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,

    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (percentage >= 0 AND percentage <= 100),

    passed BOOLEAN NOT NULL DEFAULT FALSE,

    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (
            status IN (
                'in_progress',
                'completed',
                'timed_out',
                'cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id
ON public.quiz_attempts(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id
ON public.quiz_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_quiz
ON public.quiz_attempts(student_id, quiz_id);


-- ============================================================
-- 4. ONLY ONE ACTIVE ATTEMPT
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_quiz_attempt
ON public.quiz_attempts(student_id, quiz_id)
WHERE status = 'in_progress';


-- ============================================================
-- 5. QUIZ ANSWERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attempt_id UUID NOT NULL
        REFERENCES public.quiz_attempts(id)
        ON DELETE CASCADE,

    question_id UUID NOT NULL
        REFERENCES public.quiz_questions(id)
        ON DELETE CASCADE,

    answer JSONB,

    is_correct BOOLEAN NOT NULL DEFAULT FALSE,

    points_awarded NUMERIC(5,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_attempt_question
        UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id
ON public.quiz_answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id
ON public.quiz_answers(question_id);


-- ============================================================
-- 6. QUIZ REATTEMPT REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_reattempt_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quiz_id UUID NOT NULL
        REFERENCES public.quizzes(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    reason TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (
            status IN (
                'Pending',
                'Approved',
                'Rejected'
            )
        ),

    reviewed_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    instructor_feedback TEXT,

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reattempt_requests_quiz
ON public.quiz_reattempt_requests(quiz_id);

CREATE INDEX IF NOT EXISTS idx_reattempt_requests_student
ON public.quiz_reattempt_requests(student_id);

CREATE INDEX IF NOT EXISTS idx_reattempt_requests_status
ON public.quiz_reattempt_requests(status);


-- Only one pending request for the same student and quiz
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_reattempt_request
ON public.quiz_reattempt_requests(student_id, quiz_id)
WHERE status = 'Pending';


-- ============================================================
-- 7. UPDATED_AT FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_quiz_updated_at()
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


-- ============================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trigger_set_quizzes_updated_at
ON public.quizzes;

CREATE TRIGGER trigger_set_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.set_quiz_updated_at();


DROP TRIGGER IF EXISTS trigger_set_quiz_questions_updated_at
ON public.quiz_questions;

CREATE TRIGGER trigger_set_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.set_quiz_updated_at();


DROP TRIGGER IF EXISTS trigger_set_quiz_attempts_updated_at
ON public.quiz_attempts;

CREATE TRIGGER trigger_set_quiz_attempts_updated_at
BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.set_quiz_updated_at();


DROP TRIGGER IF EXISTS trigger_set_quiz_reattempt_requests_updated_at
ON public.quiz_reattempt_requests;

CREATE TRIGGER trigger_set_quiz_reattempt_requests_updated_at
BEFORE UPDATE ON public.quiz_reattempt_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_quiz_updated_at();


-- ============================================================
-- 9. ENABLE RLS
-- ============================================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_reattempt_requests ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 10. QUIZ RLS
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view published quizzes of published courses"
ON public.quizzes;

DROP POLICY IF EXISTS "Enrolled students can view published quizzes"
ON public.quizzes;

DROP POLICY IF EXISTS "Students can view published enrolled quizzes"
ON public.quizzes;

DROP POLICY IF EXISTS "Instructors can view own course quizzes"
ON public.quizzes;

DROP POLICY IF EXISTS "Instructors can create quizzes for own courses"
ON public.quizzes;

DROP POLICY IF EXISTS "Instructors can create own course quizzes"
ON public.quizzes;

DROP POLICY IF EXISTS "Instructors can update own course quizzes"
ON public.quizzes;

DROP POLICY IF EXISTS "Instructors can delete own course quizzes"
ON public.quizzes;

DROP POLICY IF EXISTS "Admins have full access to quizzes"
ON public.quizzes;


-- Students / authenticated users can see published quizzes
-- only when the course is Published AND Approved
-- and the student is enrolled.

CREATE POLICY "Students can view published enrolled quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
    status = 'Published'
    AND EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.enrollments e
            ON e.course_id = c.id
        WHERE c.id = public.quizzes.course_id
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
          AND e.student_id = auth.uid()
    )
);


-- Instructor can view own course quizzes

CREATE POLICY "Instructors can view own course quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE c.id = public.quizzes.course_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Instructor can create quizzes only for own course

CREATE POLICY "Instructors can create own course quizzes"
ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE c.id = public.quizzes.course_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Instructor can update own quizzes

CREATE POLICY "Instructors can update own course quizzes"
ON public.quizzes
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE c.id = public.quizzes.course_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE c.id = public.quizzes.course_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Instructor can delete own quizzes

CREATE POLICY "Instructors can delete own course quizzes"
ON public.quizzes
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE c.id = public.quizzes.course_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Admin full access

CREATE POLICY "Admins have full access to quizzes"
ON public.quizzes
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


-- ============================================================
-- ============================================================
-- 11. QUIZ QUESTIONS RLS
-- ============================================================

DROP POLICY IF EXISTS "Users with quiz view access can view questions"
ON public.quiz_questions;

DROP POLICY IF EXISTS "Instructors can view own quiz questions"
ON public.quiz_questions;

DROP POLICY IF EXISTS "Instructors can manage questions for own course quizzes"
ON public.quiz_questions;

DROP POLICY IF EXISTS "Instructors can manage own quiz questions"
ON public.quiz_questions;

DROP POLICY IF EXISTS "Admins have full access to quiz questions"
ON public.quiz_questions;


-- IMPORTANT:
-- Students should NOT directly read quiz_questions because
-- the table contains correct_answer.
--
-- Student questions must be returned through the backend/API
-- without correct_answer.

-- Instructors can view questions for their own quizzes.

CREATE POLICY "Instructors can view own quiz questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_questions.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Instructors can insert/update/delete questions
-- for their own quizzes.

CREATE POLICY "Instructors can manage own quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_questions.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_questions.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Admin full access

CREATE POLICY "Admins have full access to quiz questions"
ON public.quiz_questions
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


-- ============================================================
-- 12. QUIZ ATTEMPTS RLS
-- ============================================================

DROP POLICY IF EXISTS "Students can view and start own quiz attempts"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "Students can view own quiz attempts"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "Students can create own quiz attempts"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "Instructors can view attempts on own course quizzes"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "Instructors can view own course quiz attempts"
ON public.quiz_attempts;

DROP POLICY IF EXISTS "Admins have full access to quiz attempts"
ON public.quiz_attempts;


-- Student can view own attempts

CREATE POLICY "Students can view own quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);


-- Student can create own attempt

CREATE POLICY "Students can create own quiz attempts"
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.enrollments e
            ON e.course_id = c.id
        WHERE q.id = public.quiz_attempts.quiz_id
          AND q.status = 'Published'
          AND c.course_status = 'Published'
          AND c.approval_status = 'Approved'
          AND e.student_id = auth.uid()
    )
);


-- Instructor can view attempts for own courses

CREATE POLICY "Instructors can view own course quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_attempts.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Admin full access

CREATE POLICY "Admins have full access to quiz attempts"
ON public.quiz_attempts
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


-- ============================================================
-- 13. QUIZ ANSWERS RLS
-- ============================================================

DROP POLICY IF EXISTS "Students can manage answers for own attempts"
ON public.quiz_answers;

DROP POLICY IF EXISTS "Students can manage own quiz answers"
ON public.quiz_answers;

DROP POLICY IF EXISTS "Instructors can view answers on own course quizzes"
ON public.quiz_answers;

DROP POLICY IF EXISTS "Instructors can view own course quiz answers"
ON public.quiz_answers;

DROP POLICY IF EXISTS "Admins have full access to quiz answers"
ON public.quiz_answers;


-- Student can create/view answers belonging to own attempt.
-- Final grading must still be performed by backend.

CREATE POLICY "Students can manage own quiz answers"
ON public.quiz_answers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quiz_attempts a
        WHERE a.id = public.quiz_answers.attempt_id
          AND a.student_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.quiz_attempts a
        WHERE a.id = public.quiz_answers.attempt_id
          AND a.student_id = auth.uid()
    )
);


-- Instructor can view answers from own course

CREATE POLICY "Instructors can view own course quiz answers"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quiz_attempts a
        JOIN public.quizzes q
            ON q.id = a.quiz_id
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE a.id = public.quiz_answers.attempt_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Admin full access

CREATE POLICY "Admins have full access to quiz answers"
ON public.quiz_answers
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


-- ============================================================
-- 14. REATTEMPT REQUEST RLS
-- ============================================================

DROP POLICY IF EXISTS "Students can view own reattempt requests"
ON public.quiz_reattempt_requests;

DROP POLICY IF EXISTS "Students can create reattempt requests"
ON public.quiz_reattempt_requests;

DROP POLICY IF EXISTS "Instructors can view reattempt requests"
ON public.quiz_reattempt_requests;

DROP POLICY IF EXISTS "Instructors can review reattempt requests"
ON public.quiz_reattempt_requests;

DROP POLICY IF EXISTS "Admins have full access to reattempt requests"
ON public.quiz_reattempt_requests;


-- Student can view own requests

CREATE POLICY "Students can view own reattempt requests"
ON public.quiz_reattempt_requests
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);


-- Student can create a request only for their own quiz

CREATE POLICY "Students can create reattempt requests"
ON public.quiz_reattempt_requests
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.enrollments e
            ON e.course_id = c.id
        WHERE q.id = public.quiz_reattempt_requests.quiz_id
          AND e.student_id = auth.uid()
    )
);


-- Instructor can view requests for own courses

CREATE POLICY "Instructors can view reattempt requests"
ON public.quiz_reattempt_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_reattempt_requests.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Instructor can approve/reject requests
-- only for their own course

CREATE POLICY "Instructors can review reattempt requests"
ON public.quiz_reattempt_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_reattempt_requests.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.quizzes q
        JOIN public.courses c
            ON c.id = q.course_id
        JOIN public.profiles p
            ON p.id = auth.uid()
        WHERE q.id = public.quiz_reattempt_requests.quiz_id
          AND c.instructor_id = auth.uid()
          AND p.role = 'instructor'::user_role
    )
);


-- Admin full access

CREATE POLICY "Admins have full access to reattempt requests"
ON public.quiz_reattempt_requests
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


-- ============================================================
-- 15. STUDENT-SAFE QUIZ QUESTIONS VIEW
-- ============================================================
-- This view intentionally does NOT expose:
-- correct_answer
--
-- The backend/student API should use this view when displaying
-- questions before submission.

DROP VIEW IF EXISTS public.student_quiz_questions;

CREATE VIEW public.student_quiz_questions
WITH (security_invoker = true)
AS
SELECT
    id,
    quiz_id,
    question_text,
    question_type,
    options,
    points,
    position
FROM public.quiz_questions;


-- ============================================================
-- 16. FINAL NOTES
-- ============================================================
--
-- 1. course_id is NOT UNIQUE:
--    A course can contain multiple quizzes.
--
-- 2. quiz_type:
--    Mandatory / Optional
--
-- 3. quiz status:
--    Draft / Published / Archived
--
-- 4. max_attempts controls normal attempts.
--
-- 5. Only one in_progress attempt is allowed per student/quiz.
--
-- 6. After all attempts are exhausted:
--    Student can create a Pending reattempt request.
--
-- 7. Instructor can Approve or Reject that request.
--
-- 8. Backend must verify:
--       - max_attempts
--       - previous attempts
--       - approved reattempt requests
--       - enrollment
--       - quiz publication
--       - course publication
--       - course approval
--
-- 9. Backend must calculate:
--       score
--       total_score
--       percentage
--       passed
--
-- 10. Never trust score/passed values sent by the frontend.
--
-- 11. Student-facing quiz questions must use the
--     student-safe API/view and must never expose correct_answer.
--
-- ============================================================

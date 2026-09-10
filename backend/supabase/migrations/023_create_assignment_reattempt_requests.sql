-- ============================================================
-- 023_create_assignment_reattempt_requests.sql
-- Description: Create assignment_reattempt_requests table with RLS & indexes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_reattempt_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    assignment_id UUID NOT NULL
        REFERENCES public.assignments(id)
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

CREATE INDEX IF NOT EXISTS idx_assignment_reattempt_requests_assignment
ON public.assignment_reattempt_requests(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_reattempt_requests_student
ON public.assignment_reattempt_requests(student_id);

CREATE INDEX IF NOT EXISTS idx_assignment_reattempt_requests_status
ON public.assignment_reattempt_requests(status);

-- Only one pending request per student and assignment
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_assignment_reattempt_request
ON public.assignment_reattempt_requests(student_id, assignment_id)
WHERE status = 'Pending';

-- Enable Row Level Security
ALTER TABLE public.assignment_reattempt_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own assignment reattempt requests
DROP POLICY IF EXISTS "Students can view own assignment reattempt requests" ON public.assignment_reattempt_requests;
CREATE POLICY "Students can view own assignment reattempt requests"
ON public.assignment_reattempt_requests
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own assignment reattempt requests
DROP POLICY IF EXISTS "Students can create assignment reattempt requests" ON public.assignment_reattempt_requests;
CREATE POLICY "Students can create assignment reattempt requests"
ON public.assignment_reattempt_requests
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Instructors can view assignment reattempt requests for their courses
DROP POLICY IF EXISTS "Instructors can view assignment reattempt requests" ON public.assignment_reattempt_requests;
CREATE POLICY "Instructors can view assignment reattempt requests"
ON public.assignment_reattempt_requests
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.assignments a
        JOIN public.courses c ON c.id = a.course_id
        WHERE a.id = public.assignment_reattempt_requests.assignment_id
          AND c.instructor_id = auth.uid()
    )
);

-- Instructors can update assignment reattempt requests for their courses
DROP POLICY IF EXISTS "Instructors can review assignment reattempt requests" ON public.assignment_reattempt_requests;
CREATE POLICY "Instructors can review assignment reattempt requests"
ON public.assignment_reattempt_requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.assignments a
        JOIN public.courses c ON c.id = a.course_id
        WHERE a.id = public.assignment_reattempt_requests.assignment_id
          AND c.instructor_id = auth.uid()
    )
);

-- Admins full access
DROP POLICY IF EXISTS "Admins have full access to assignment reattempt requests" ON public.assignment_reattempt_requests;
CREATE POLICY "Admins have full access to assignment reattempt requests"
ON public.assignment_reattempt_requests
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE public.profiles.id = auth.uid()
          AND public.profiles.role = 'admin'
    )
);

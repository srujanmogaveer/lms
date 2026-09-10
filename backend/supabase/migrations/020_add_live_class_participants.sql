-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 020: LIVE CLASS PARTICIPANTS
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.live_class_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    CONSTRAINT uq_live_class_participants_class_user UNIQUE (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_class_participants_class_id ON public.live_class_participants(class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_user_id ON public.live_class_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_active ON public.live_class_participants(class_id, left_at) WHERE left_at IS NULL;

ALTER TABLE public.live_class_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to live_class_participants" ON public.live_class_participants;
CREATE POLICY "Admins have full access to live_class_participants" ON public.live_class_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'admin'));

DROP POLICY IF EXISTS "Instructors can view participants of own classes" ON public.live_class_participants;
CREATE POLICY "Instructors can view participants of own classes" ON public.live_class_participants FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.live_classes lc JOIN public.profiles p ON p.id = auth.uid() WHERE lc.id = live_class_participants.class_id AND lc.instructor_id = auth.uid() AND p.role::text = 'instructor'));

DROP POLICY IF EXISTS "Instructors can manage own participant record" ON public.live_class_participants;
CREATE POLICY "Instructors can manage own participant record" ON public.live_class_participants FOR ALL TO authenticated
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'instructor'))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'instructor'));

DROP POLICY IF EXISTS "Students can insert own participant record" ON public.live_class_participants;
CREATE POLICY "Students can insert own participant record" ON public.live_class_participants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role::text = 'student'));

DROP POLICY IF EXISTS "Students can update own participant record" ON public.live_class_participants;
CREATE POLICY "Students can update own participant record" ON public.live_class_participants FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can view own participant record" ON public.live_class_participants;
CREATE POLICY "Students can view own participant record" ON public.live_class_participants FOR SELECT TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE public.live_class_participants IS 'Tracks which users joined each EduSphere live class session. UNIQUE(class_id, user_id) prevents duplicates - re-joins update via UPSERT.';
COMMENT ON COLUMN public.live_class_participants.left_at IS 'NULL means still in session. Set on page unmount or explicit leave.';

GRANT SELECT, INSERT, UPDATE ON public.live_class_participants TO authenticated;

COMMIT;

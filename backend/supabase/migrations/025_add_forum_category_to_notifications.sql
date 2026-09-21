-- ============================================================================
-- EDUSPHERE LMS
-- MIGRATION 025: ADD 'forum' CATEGORY TO NOTIFICATIONS CHECK CONSTRAINT
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_category_check CHECK (
            category IN (
                'announcement',
                'course',
                'assignment',
                'quiz',
                'live_class',
                'chat',
                'payment',
                'forum',
                'system'
            )
        );
    END IF;
END $$;

COMMIT;

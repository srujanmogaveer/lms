-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 022: PLATFORM SETTINGS & SYSTEM CONFIGURATION
-- ============================================================

BEGIN;

-- 1. Create Singleton Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    platform_name TEXT NOT NULL DEFAULT 'EduSphere Learning Management System',
    support_email TEXT NOT NULL DEFAULT 'support@edusphere.edu',
    support_phone TEXT NOT NULL DEFAULT '9876543210',
    enable_student_registration BOOLEAN NOT NULL DEFAULT true,
    enable_instructor_registration BOOLEAN NOT NULL DEFAULT true,
    platform_commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (platform_commission_percent >= 0 AND platform_commission_percent <= 100),
    enable_maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT NOT NULL DEFAULT 'The platform is currently under maintenance.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT chk_singleton_platform_settings CHECK (id = 'default')
);

-- 2. Insert Default Singleton Row
INSERT INTO public.platform_settings (
    id,
    platform_name,
    support_email,
    support_phone,
    enable_student_registration,
    enable_instructor_registration,
    platform_commission_percent,
    enable_maintenance_mode,
    maintenance_message
) VALUES (
    'default',
    'EduSphere Learning Management System',
    'support@edusphere.edu',
    '9876543210',
    true,
    true,
    15.00,
    false,
    'The platform is currently under maintenance.'
) ON CONFLICT (id) DO NOTHING;

-- 3. Updated At Trigger
DROP TRIGGER IF EXISTS set_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER set_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Public and Authenticated users can read non-sensitive platform settings
DROP POLICY IF EXISTS "Public and Authenticated can read platform settings" ON public.platform_settings;
CREATE POLICY "Public and Authenticated can read platform settings"
ON public.platform_settings FOR SELECT
TO public
USING (true);

-- Only Admins can modify platform settings
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings"
ON public.platform_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
);

-- 6. Grants
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO authenticated;

COMMIT;

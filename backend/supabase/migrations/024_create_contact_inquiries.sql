-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 024: CONTACT INQUIRIES & SUPPORT TICKETS
-- ============================================================

BEGIN;

-- 1. Create Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_category ON public.contact_inquiries(category);

-- 3. Updated At Trigger
DROP TRIGGER IF EXISTS set_contact_inquiries_updated_at ON public.contact_inquiries;
CREATE TRIGGER set_contact_inquiries_updated_at
BEFORE UPDATE ON public.contact_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Public & Authenticated users can insert an inquiry
DROP POLICY IF EXISTS "Anyone can submit a contact inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit a contact inquiry"
ON public.contact_inquiries FOR INSERT
TO public
WITH CHECK (true);

-- Admins can view all inquiries
DROP POLICY IF EXISTS "Admins can view contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view contact inquiries"
ON public.contact_inquiries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
);

-- Admins can update inquiries (e.g. mark resolved)
DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact inquiries"
ON public.contact_inquiries FOR UPDATE
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

-- Admins can delete inquiries
DROP POLICY IF EXISTS "Admins can delete contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can delete contact inquiries"
ON public.contact_inquiries FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
);

-- 6. Grants
GRANT INSERT ON public.contact_inquiries TO anon, authenticated;
GRANT ALL ON public.contact_inquiries TO authenticated;

COMMIT;

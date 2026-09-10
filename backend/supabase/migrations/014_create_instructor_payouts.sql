-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 014: INSTRUCTOR PAYOUTS
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CREATE INSTRUCTOR PAYOUTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.instructor_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    instructor_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    amount NUMERIC(10,2) NOT NULL
        CHECK (amount > 0),

    currency TEXT NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    payout_method TEXT NOT NULL DEFAULT 'Bank Transfer'
        CHECK (
            payout_method IN (
                'Bank Transfer',
                'UPI',
                'Bank Account',
                'UPI ID'
            )
        ),

    transaction_id TEXT NOT NULL,

    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status TEXT NOT NULL DEFAULT 'Paid'
        CHECK (
            status IN (
                'Pending',
                'Processing',
                'Paid',
                'Failed',
                'Cancelled'
            )
        ),

    notes TEXT,

    created_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_instructor_payouts_instructor_id
ON public.instructor_payouts(instructor_id);

CREATE INDEX IF NOT EXISTS idx_instructor_payouts_created_by
ON public.instructor_payouts(created_by);

CREATE INDEX IF NOT EXISTS idx_instructor_payouts_status
ON public.instructor_payouts(status);

CREATE INDEX IF NOT EXISTS idx_instructor_payouts_payment_date
ON public.instructor_payouts(payment_date DESC);

-- Prevent duplicate UTR / transaction IDs
CREATE UNIQUE INDEX IF NOT EXISTS
uq_instructor_payouts_transaction_id
ON public.instructor_payouts(transaction_id);


-- ============================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_instructor_payouts_updated_at()
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

DROP TRIGGER IF EXISTS
trigger_set_instructor_payouts_updated_at
ON public.instructor_payouts;

CREATE TRIGGER
trigger_set_instructor_payouts_updated_at
BEFORE UPDATE ON public.instructor_payouts
FOR EACH ROW
EXECUTE FUNCTION public.set_instructor_payouts_updated_at();


-- ============================================================
-- 4. ENABLE RLS
-- ============================================================

ALTER TABLE public.instructor_payouts
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. INSTRUCTOR: VIEW OWN PAYOUTS ONLY
-- ============================================================

DROP POLICY IF EXISTS
"Instructors can view own payouts"
ON public.instructor_payouts;

CREATE POLICY
"Instructors can view own payouts"
ON public.instructor_payouts
FOR SELECT
TO authenticated
USING (
    instructor_id = auth.uid()
);


-- ============================================================
-- 6. ADMIN: FULL PAYOUT ACCESS
--
-- Uses role comparison as text so this works whether
-- profiles.role is TEXT or an enum type.
-- ============================================================

DROP POLICY IF EXISTS
"Admins have full access to instructor payouts"
ON public.instructor_payouts;

CREATE POLICY
"Admins have full access to instructor payouts"
ON public.instructor_payouts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role::text = 'admin'
    )
);


-- ============================================================
-- 7. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.instructor_payouts IS
'Persistent administrative payout records for instructors. This table records payouts made outside the LMS and their UTR/transaction references. It does not modify student payments.';

COMMENT ON COLUMN public.instructor_payouts.transaction_id IS
'UTR, bank reference number, or UPI transaction reference entered by the administrator.';

COMMENT ON COLUMN public.instructor_payouts.created_by IS
'Administrator who recorded the payout in EduSphere LMS.';


-- ============================================================
-- 8. GRANTS
-- ============================================================

GRANT SELECT
ON public.instructor_payouts
TO authenticated;

COMMIT;

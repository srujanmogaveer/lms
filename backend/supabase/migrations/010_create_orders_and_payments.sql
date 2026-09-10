-- ============================================================
-- EDUSPHERE LMS
-- MIGRATION 010: ORDERS, ORDER_ITEMS & PAYMENTS
-- DATABASE + CONSTRAINTS + INDEXES + RLS
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_number TEXT NOT NULL UNIQUE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    total_amount NUMERIC(10,2) NOT NULL
        CHECK (total_amount >= 0),

    currency TEXT NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (
            status IN (
                'Pending',
                'Completed',
                'Failed',
                'Cancelled'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES public.orders(id)
        ON DELETE CASCADE,

    course_id UUID NOT NULL
        REFERENCES public.courses(id)
        ON DELETE RESTRICT,

    unit_price NUMERIC(10,2) NOT NULL
        CHECK (unit_price >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_order_item_course
        UNIQUE (order_id, course_id)
);

-- ============================================================
-- 3. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES public.orders(id)
        ON DELETE CASCADE,

    student_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    payment_gateway TEXT NOT NULL DEFAULT 'Razorpay',

    gateway_order_id TEXT,

    gateway_payment_id TEXT,

    gateway_signature TEXT,

    amount NUMERIC(10,2) NOT NULL
        CHECK (amount >= 0),

    currency TEXT NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    payment_method TEXT,

    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (
            status IN (
                'Pending',
                'Success',
                'Failed'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payment_order
        UNIQUE (order_id)
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_student_id
ON public.orders(student_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_course_id
ON public.order_items(course_id);

CREATE INDEX IF NOT EXISTS idx_payments_student_id
ON public.payments(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
ON public.payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id
ON public.payments(gateway_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON public.payments(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_payment_id
ON public.payments(gateway_payment_id)
WHERE gateway_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_order_id
ON public.payments(gateway_order_id)
WHERE gateway_order_id IS NOT NULL;

-- ============================================================
-- 5. ORDERS UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_orders_updated_at
ON public.orders;

CREATE TRIGGER trigger_set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_orders_updated_at();

-- ============================================================
-- 6. PAYMENTS UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_payments_updated_at()
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

DROP TRIGGER IF EXISTS trigger_set_payments_updated_at
ON public.payments;

CREATE TRIGGER trigger_set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_payments_updated_at();

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. ORDERS — STUDENT SELECT
-- ============================================================

DROP POLICY IF EXISTS "Students can view own orders"
ON public.orders;

CREATE POLICY "Students can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);

-- ============================================================
-- 9. ORDERS — ADMIN FULL ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Admins have full access to orders"
ON public.orders;

CREATE POLICY "Admins have full access to orders"
ON public.orders
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
-- 10. ORDER ITEMS — STUDENT SELECT
-- ============================================================

DROP POLICY IF EXISTS "Students can view own order items"
ON public.order_items;

CREATE POLICY "Students can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = public.order_items.order_id
          AND o.student_id = auth.uid()
    )
);

-- ============================================================
-- 11. ORDER ITEMS — ADMIN FULL ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Admins have full access to order items"
ON public.order_items;

CREATE POLICY "Admins have full access to order items"
ON public.order_items
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
-- 12. PAYMENTS — STUDENT SELECT
-- ============================================================

DROP POLICY IF EXISTS "Students can view own payments"
ON public.payments;

CREATE POLICY "Students can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
);

-- ============================================================
-- 13. PAYMENTS — ADMIN FULL ACCESS
-- ============================================================

DROP POLICY IF EXISTS "Admins have full access to payments"
ON public.payments;

CREATE POLICY "Admins have full access to payments"
ON public.payments
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

COMMIT;

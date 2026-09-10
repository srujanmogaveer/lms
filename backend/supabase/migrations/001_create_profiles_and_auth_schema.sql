-- Migration: 001_create_profiles_and_auth_schema.sql
-- Description: Hardened profiles table, triggers, and Row Level Security for EduSphere LMS Authentication & User Management

-- Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'pending_approval');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instructor_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status account_status NOT NULL DEFAULT 'active',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone TEXT,
    bio TEXT,
    headline TEXT,
    
    -- Student Specific Metadata
    student_id_number TEXT UNIQUE,
    learning_streak_days INTEGER NOT NULL DEFAULT 0,
    enrolled_courses_count INTEGER NOT NULL DEFAULT 0,
    completed_courses_count INTEGER NOT NULL DEFAULT 0,
    certificates_count INTEGER NOT NULL DEFAULT 0,

    -- Instructor Specific Metadata & Approval Workflow
    instructor_approval_status instructor_approval_status DEFAULT 'pending',
    qualification TEXT,
    experience TEXT,
    specialization TEXT,
    courses_created_count INTEGER NOT NULL DEFAULT 0,
    total_students INTEGER NOT NULL DEFAULT 0,
    instructor_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,

    -- Admin Specific Permissions (Accessible / Modifiable only by Admin)
    admin_permissions TEXT[] DEFAULT ARRAY['all'],

    -- User Preferences
    theme_preference TEXT DEFAULT 'system',
    language_preference TEXT DEFAULT 'en',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Integrity Constraints
    CONSTRAINT valid_streak_check CHECK (learning_streak_days >= 0),
    CONSTRAINT valid_enrolled_courses CHECK (enrolled_courses_count >= 0),
    CONSTRAINT valid_completed_courses CHECK (completed_courses_count >= 0),
    CONSTRAINT valid_certificates CHECK (certificates_count >= 0),
    CONSTRAINT valid_courses_created CHECK (courses_created_count >= 0),
    CONSTRAINT valid_total_students CHECK (total_students >= 0),
    CONSTRAINT valid_instructor_rating CHECK (instructor_rating >= 0.00 AND instructor_rating <= 5.00)
);

-- 3. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_instructor_approval ON public.profiles(instructor_approval_status);

-- 4. Secure updated_at Trigger Function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
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

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Hardened New User Trigger Function (SECURITY DEFINER with strict search_path)
-- CRITICAL SECURITY RULE:
-- Public registration via raw_user_meta_data can NEVER assign the 'admin' role.
-- Any request declaring 'admin' or invalid role defaults safely to 'student'.
-- 'instructor' registration always forces status='pending_approval' & instructor_approval_status='pending'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role user_role;
    v_status account_status;
    v_approval instructor_approval_status;
    v_raw_role TEXT;
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    v_raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));
    
    -- Extract full name from standard metadata fields or OAuth provider payload
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'user_name',
        SPLIT_PART(COALESCE(NEW.email, 'User'), '@', 1),
        'EduSphere User'
    );

    -- Extract avatar URL from standard metadata fields or Google OAuth picture
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'avatar',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    );

    -- Strict Whitelist: Only 'instructor' or 'student' can be created through public self-signup.
    -- Attempting 'admin' self-registration is strictly disallowed and downgraded to 'student'.
    IF v_raw_role = 'instructor' THEN
        v_role := 'instructor'::user_role;
        v_status := 'pending_approval'::account_status;
        v_approval := 'pending'::instructor_approval_status;
    ELSE
        -- Default for 'student', Google OAuth sign-ins, and any unverified/forged roles (including 'admin')
        v_role := 'student'::user_role;
        v_status := 'active'::account_status;
        v_approval := 'approved'::instructor_approval_status;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        phone,
        qualification,
        experience,
        specialization,
        instructor_approval_status,
        student_id_number,
        admin_permissions
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        v_full_name,
        v_role,
        v_status,
        v_avatar_url,
        NEW.raw_user_meta_data->>'phone',
        CASE WHEN v_role = 'instructor' THEN NEW.raw_user_meta_data->>'qualification' ELSE NULL END,
        CASE WHEN v_role = 'instructor' THEN NEW.raw_user_meta_data->>'experience' ELSE NULL END,
        CASE WHEN v_role = 'instructor' THEN NEW.raw_user_meta_data->>'specialization' ELSE NULL END,
        v_approval,
        CASE WHEN v_role = 'student' THEN 'STU-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8)) ELSE NULL END,
        ARRAY[]::TEXT[] -- Empty permissions for public self-registered accounts
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 6. Helper Function for Admin Authorization (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT
-- Users can view their own profile; Admins can view all profiles;
-- Anyone (including prospective students) can view approved instructors' public profiles for course cards & instructor bios
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id
    OR public.is_admin()
    OR (role = 'instructor' AND instructor_approval_status = 'approved')
);

-- Policy 2: UPDATE (Strict Self-Profile Update Guard)
-- Non-admin users are restricted to modifying only legitimate personal profile fields.
-- Privilege escalation (modifying role, status, approval status, counts, rating, or admin_permissions) is blocked.
DROP POLICY IF EXISTS "Profiles self update policy" ON public.profiles;
CREATE POLICY "Profiles self update policy"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() = id OR public.is_admin()
)
WITH CHECK (
    public.is_admin()
    OR (
        auth.uid() = id
        -- Guarantee immutable security fields for regular users
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
        AND instructor_approval_status = (SELECT p.instructor_approval_status FROM public.profiles p WHERE p.id = auth.uid())
        AND learning_streak_days = (SELECT p.learning_streak_days FROM public.profiles p WHERE p.id = auth.uid())
        AND enrolled_courses_count = (SELECT p.enrolled_courses_count FROM public.profiles p WHERE p.id = auth.uid())
        AND completed_courses_count = (SELECT p.completed_courses_count FROM public.profiles p WHERE p.id = auth.uid())
        AND certificates_count = (SELECT p.certificates_count FROM public.profiles p WHERE p.id = auth.uid())
        AND courses_created_count = (SELECT p.courses_created_count FROM public.profiles p WHERE p.id = auth.uid())
        AND total_students = (SELECT p.total_students FROM public.profiles p WHERE p.id = auth.uid())
        AND instructor_rating = (SELECT p.instructor_rating FROM public.profiles p WHERE p.id = auth.uid())
        AND admin_permissions = (SELECT p.admin_permissions FROM public.profiles p WHERE p.id = auth.uid())
    )
);

-- Policy 3: INSERT
-- Profile inserts are handled primarily by the secure auth trigger and service role, or explicitly by an authenticated Admin.
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy"
ON public.profiles
FOR INSERT
WITH CHECK (
    auth.uid() = id OR public.is_admin() OR auth.role() = 'service_role'
);

-- Policy 4: DELETE
-- Strictly Admins and Service Role can delete profiles
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
CREATE POLICY "Profiles delete policy"
ON public.profiles
FOR DELETE
USING (
    public.is_admin() OR auth.role() = 'service_role'
);

-- ============================================================
-- MIGRATION 013: Add Extended Profile Columns
-- ============================================================
-- Fixes: All Profile & Settings persistence failures.
-- Root cause: These columns were referenced in backend code
-- but never created in the database. Supabase silently discards
-- unknown columns in UPDATE — appearing to succeed while
-- saving nothing.
-- ============================================================

-- 1. Add all missing extended profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth            DATE,
  ADD COLUMN IF NOT EXISTS gender                   TEXT,
  ADD COLUMN IF NOT EXISTS country                  TEXT,
  ADD COLUMN IF NOT EXISTS state                    TEXT,
  ADD COLUMN IF NOT EXISTS city                     TEXT,
  ADD COLUMN IF NOT EXISTS timezone                 TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS linkedin_url             TEXT,
  ADD COLUMN IF NOT EXISTS personal_website         TEXT,
  ADD COLUMN IF NOT EXISTS payout_info              JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS privacy_settings         JSONB DEFAULT NULL;

-- 2. Column documentation
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth (DATE, nullable)';
COMMENT ON COLUMN public.profiles.gender IS 'User gender identity (free text, nullable)';
COMMENT ON COLUMN public.profiles.country IS 'User country of residence';
COMMENT ON COLUMN public.profiles.state IS 'User state or province';
COMMENT ON COLUMN public.profiles.city IS 'User city';
COMMENT ON COLUMN public.profiles.timezone IS 'User preferred timezone (e.g. Asia/Kolkata)';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL (instructors & admins)';
COMMENT ON COLUMN public.profiles.personal_website IS 'Personal or professional website URL';
COMMENT ON COLUMN public.profiles.payout_info IS 'Instructor payout info: bank account or UPI details (JSONB)';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preference flags (JSONB)';
COMMENT ON COLUMN public.profiles.privacy_settings IS 'User privacy and visibility settings (JSONB)';

-- ============================================================
-- 3. Replace the self-update RLS policy
--
-- Drops the original "Profiles self update policy" (created in
-- migration 001) and replaces it with an equivalent that:
--
-- a) Fixes a NULL-comparison bug in the original:
--    The original used = for nullable fields
--    (instructor_approval_status, admin_permissions,
--    instructor_rating). In SQL, NULL = NULL evaluates to UNKNOWN,
--    not TRUE, causing WITH CHECK to silently fail for rows where
--    these fields are NULL. IS NOT DISTINCT FROM treats
--    NULL IS NOT DISTINCT FROM NULL as TRUE.
--
-- b) Adds LIMIT 1 to all subqueries to hint the planner.
--
-- c) Preserves ALL 9 immutable fields from the original policy
--    (no security regression):
--    - role, status, instructor_approval_status, admin_permissions
--      → prevent privilege escalation
--    - learning_streak_days, enrolled_courses_count,
--      completed_courses_count, certificates_count,
--      courses_created_count, total_students, instructor_rating
--      → prevent self-modification of system-managed counters
--
-- The backend always uses supabaseAdmin (service role) which
-- bypasses RLS. These policies are the last line of defense
-- against direct anon-key or JWT-authenticated client calls.
-- ============================================================

DROP POLICY IF EXISTS "Profiles self update policy" ON public.profiles;

CREATE POLICY "Profiles self update policy"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    -- Admins bypass all field restrictions
    public.is_admin()
    OR (
      auth.uid() = id
      -- Security-critical: prevent role/status/permissions escalation
      AND role = (
        SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND status = (
        SELECT status FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND instructor_approval_status IS NOT DISTINCT FROM (
        SELECT instructor_approval_status FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND admin_permissions IS NOT DISTINCT FROM (
        SELECT admin_permissions FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      -- Platform integrity: prevent self-modification of system-managed counters
      AND learning_streak_days = (
        SELECT learning_streak_days FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND enrolled_courses_count = (
        SELECT enrolled_courses_count FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND completed_courses_count = (
        SELECT completed_courses_count FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND certificates_count = (
        SELECT certificates_count FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND courses_created_count = (
        SELECT courses_created_count FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND total_students = (
        SELECT total_students FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
      AND instructor_rating IS NOT DISTINCT FROM (
        SELECT instructor_rating FROM public.profiles WHERE id = auth.uid() LIMIT 1
      )
    )
  );

-- ============================================================
-- 4. Supabase Storage: Avatar bucket RLS policies
--
-- These policies allow public read and self-scoped
-- authenticated write for the 'avatars' storage bucket.
--
-- Upload path used by storageService.ts:
--   `${userId}/avatar-${Date.now()}.${ext}`
-- storage.foldername(name)[1] extracts the first path segment
-- which equals the userId — confirmed match with upload code.
--
-- NOTE: The 'avatars' bucket itself is created programmatically
-- by StorageService.ensureAvatarsBucket() on server startup.
-- These policies take effect automatically once the bucket exists.
-- No existing avatar storage policies are present in any prior
-- migration — these DROP ... IF EXISTS guards are purely defensive.
-- ============================================================

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"   ON storage.objects;

-- Public read: anyone can view avatar images (required for CDN URLs in <img> tags)
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Self-scoped upload: userId must match the first segment of the storage path
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Self-scoped update (storageService.ts uses upsert: true)
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Self-scoped delete (allows replacing avatar without orphaned files)
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

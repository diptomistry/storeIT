
-- ============================================================
-- STORE IT - Initial Database Schema
-- PostgreSQL + Supabase Auth
-- Cloudflare R2 stores actual file contents.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. UPDATED_AT HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically create a profile after Supabase registration.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. FOLDERS
-- ============================================================

CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  parent_id UUID,

  name TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Enables composite foreign keys enforcing ownership.
  CONSTRAINT folders_id_user_unique UNIQUE (id, user_id),

  CONSTRAINT folders_name_not_empty
    CHECK (length(trim(name)) > 0),

  CONSTRAINT folders_no_self_parent
    CHECK (parent_id IS NULL OR parent_id <> id),

  CONSTRAINT folders_parent_same_user
    FOREIGN KEY (parent_id, user_id)
    REFERENCES public.folders(id, user_id)
    ON DELETE RESTRICT
);

CREATE INDEX folders_user_idx
ON public.folders(user_id);

CREATE INDEX folders_parent_idx
ON public.folders(user_id, parent_id);

CREATE INDEX folders_active_idx
ON public.folders(user_id, deleted_at)
WHERE deleted_at IS NULL;

CREATE TRIGGER folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Prevent moving a folder into itself or its descendants.

CREATE OR REPLACE FUNCTION public.prevent_folder_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  creates_cycle BOOLEAN;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.parent_id IS NOT DISTINCT FROM OLD.parent_id THEN
    RETURN NEW;
  END IF;

  WITH RECURSIVE descendants(id) AS (
    SELECT NEW.id

    UNION ALL

    SELECT f.id
    FROM public.folders f
    INNER JOIN descendants d ON f.parent_id = d.id
    WHERE f.user_id = NEW.user_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM descendants
    WHERE id = NEW.parent_id
  )
  INTO creates_cycle;

  IF creates_cycle THEN
    RAISE EXCEPTION 'Cannot move a folder into itself or its descendants';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_folder_cycles
BEFORE INSERT OR UPDATE OF parent_id ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.prevent_folder_cycle();

-- ============================================================
-- 4. FILES
-- ============================================================

CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  folder_id UUID,

  -- Original filename shown to the user.
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,

  -- Random, opaque Cloudflare R2 object key.
  storage_key TEXT NOT NULL UNIQUE,

  mime_type TEXT,
  extension TEXT,

  size BIGINT NOT NULL CHECK (size >= 0),

  checksum TEXT,

  is_starred BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT files_id_user_unique UNIQUE (id, user_id),

  CONSTRAINT files_name_not_empty
    CHECK (length(trim(name)) > 0),

  -- A file can only belong to a folder owned by the same user.
  CONSTRAINT files_folder_same_user
    FOREIGN KEY (folder_id, user_id)
    REFERENCES public.folders(id, user_id)
    ON DELETE RESTRICT
);

CREATE INDEX files_user_idx
ON public.files(user_id);

CREATE INDEX files_folder_idx
ON public.files(user_id, folder_id);

CREATE INDEX files_active_idx
ON public.files(user_id, deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX files_recent_idx
ON public.files(user_id, updated_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX files_starred_idx
ON public.files(user_id, is_starred)
WHERE is_starred = TRUE AND deleted_at IS NULL;

CREATE INDEX files_mime_type_idx
ON public.files(user_id, mime_type);

CREATE INDEX files_size_idx
ON public.files(user_id, size DESC);

CREATE INDEX files_name_search_idx
ON public.files
USING GIN (to_tsvector('simple', name));

CREATE TRIGGER files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. USER STORAGE USAGE
-- ============================================================

CREATE TABLE public.user_storage_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  used_bytes BIGINT NOT NULL DEFAULT 0
    CHECK (used_bytes >= 0),

  reserved_bytes BIGINT NOT NULL DEFAULT 0
    CHECK (reserved_bytes >= 0),

  quota_bytes BIGINT NOT NULL DEFAULT 1073741824
    CHECK (quota_bytes > 0),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically initialize storage usage for new users.

CREATE OR REPLACE FUNCTION public.create_user_storage_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_storage_usage(user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_storage_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_user_storage_usage();

-- ============================================================
-- 6. STORAGE USAGE TRACKING
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN

    UPDATE public.user_storage_usage
    SET used_bytes = used_bytes + NEW.size,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN

    UPDATE public.user_storage_usage
    SET used_bytes = GREATEST(0, used_bytes - OLD.size),
        updated_at = NOW()
    WHERE user_id = OLD.user_id;

    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN

    IF OLD.user_id <> NEW.user_id THEN
      RAISE EXCEPTION 'Changing file ownership is not allowed';
    END IF;

    UPDATE public.user_storage_usage
    SET used_bytes = GREATEST(0, used_bytes + NEW.size - OLD.size),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER files_storage_usage_trigger
AFTER INSERT OR UPDATE OF size OR DELETE
ON public.files
FOR EACH ROW EXECUTE FUNCTION public.update_storage_usage();

-- ============================================================
-- 7. UPLOAD SESSIONS
-- ============================================================

CREATE TABLE public.upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  storage_key TEXT NOT NULL UNIQUE,

  original_name TEXT NOT NULL,

  mime_type TEXT,

  expected_size BIGINT NOT NULL CHECK (expected_size > 0),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  completed_at TIMESTAMPTZ,

  CONSTRAINT upload_session_user_id_id_unique
    UNIQUE (user_id, id)
);

CREATE INDEX upload_sessions_user_idx
ON public.upload_sessions(user_id, status);

CREATE INDEX upload_sessions_expiry_idx
ON public.upload_sessions(expires_at)
WHERE status = 'pending';

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Folders

CREATE POLICY "Users can view own folders"
ON public.folders FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own folders"
ON public.folders FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own folders"
ON public.folders FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own folders"
ON public.folders FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Files

CREATE POLICY "Users can view own files"
ON public.files FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own files"
ON public.files FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own files"
ON public.files FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own files"
ON public.files FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Storage usage: users can only read their own quota information.
-- Writes are performed by database triggers and trusted backend operations.

CREATE POLICY "Users can view own storage usage"
ON public.user_storage_usage FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Upload sessions: users can view their own upload sessions.
-- Creation and state transitions should be performed through
-- authenticated server-side upload workflows.

CREATE POLICY "Users can view own upload sessions"
ON public.upload_sessions FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 9. PRIVILEGES
-- ============================================================

REVOKE ALL ON public.user_storage_usage FROM anon, authenticated;
GRANT SELECT ON public.user_storage_usage TO authenticated;

REVOKE ALL ON public.upload_sessions FROM anon, authenticated;
GRANT SELECT ON public.upload_sessions TO authenticated;

-- ============================================================
-- END OF INITIAL SCHEMA
-- ============================================================

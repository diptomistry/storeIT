-- ============================================================
-- STORE IT - Storage helpers & recursive folder operations
-- ============================================================

-- Atomically reserve storage for an in-flight upload.
CREATE OR REPLACE FUNCTION public.reserve_storage(p_user_id UUID, p_bytes BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_rows INT;
BEGIN
  IF p_bytes IS NULL OR p_bytes <= 0 THEN
    RAISE EXCEPTION 'Reserved bytes must be positive';
  END IF;

  UPDATE public.user_storage_usage
  SET reserved_bytes = reserved_bytes + p_bytes,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND used_bytes + reserved_bytes + p_bytes <= quota_bytes;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    RAISE EXCEPTION 'Insufficient storage quota';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_reserved_storage(p_user_id UUID, p_bytes BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_bytes IS NULL OR p_bytes <= 0 THEN
    RETURN;
  END IF;

  UPDATE public.user_storage_usage
  SET reserved_bytes = GREATEST(0, reserved_bytes - p_bytes),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Soft-delete a folder and all descendant folders/files owned by the user.
CREATE OR REPLACE FUNCTION public.soft_delete_folder_tree(p_folder_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  folder_ids UUID[];
BEGIN
  WITH RECURSIVE tree AS (
    SELECT id
    FROM public.folders
    WHERE id = p_folder_id
      AND user_id = p_user_id
      AND deleted_at IS NULL

    UNION ALL

    SELECT f.id
    FROM public.folders f
    INNER JOIN tree t ON f.parent_id = t.id
    WHERE f.user_id = p_user_id
      AND f.deleted_at IS NULL
  )
  SELECT ARRAY_AGG(id) INTO folder_ids FROM tree;

  IF folder_ids IS NULL OR array_length(folder_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Folder not found';
  END IF;

  UPDATE public.folders
  SET deleted_at = NOW()
  WHERE user_id = p_user_id
    AND id = ANY (folder_ids)
    AND deleted_at IS NULL;

  UPDATE public.files
  SET deleted_at = NOW()
  WHERE user_id = p_user_id
    AND folder_id = ANY (folder_ids)
    AND deleted_at IS NULL;
END;
$$;

-- Restore a soft-deleted folder tree and files deleted in the same operation window.
CREATE OR REPLACE FUNCTION public.restore_folder_tree(p_folder_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  root_deleted_at TIMESTAMPTZ;
  folder_ids UUID[];
BEGIN
  SELECT deleted_at INTO root_deleted_at
  FROM public.folders
  WHERE id = p_folder_id
    AND user_id = p_user_id;

  IF root_deleted_at IS NULL THEN
    RAISE EXCEPTION 'Folder is not in trash';
  END IF;

  WITH RECURSIVE tree AS (
    SELECT id
    FROM public.folders
    WHERE id = p_folder_id
      AND user_id = p_user_id

    UNION ALL

    SELECT f.id
    FROM public.folders f
    INNER JOIN tree t ON f.parent_id = t.id
    WHERE f.user_id = p_user_id
  )
  SELECT ARRAY_AGG(id) INTO folder_ids FROM tree;

  UPDATE public.folders
  SET deleted_at = NULL
  WHERE user_id = p_user_id
    AND id = ANY (folder_ids)
    AND deleted_at IS NOT NULL
    AND deleted_at >= root_deleted_at - INTERVAL '1 second';

  UPDATE public.files
  SET deleted_at = NULL
  WHERE user_id = p_user_id
    AND folder_id = ANY (folder_ids)
    AND deleted_at IS NOT NULL
    AND deleted_at >= root_deleted_at - INTERVAL '1 second';
END;
$$;

-- Track folder_id on upload sessions for completion metadata.
ALTER TABLE public.upload_sessions
  ADD COLUMN IF NOT EXISTS folder_id UUID;

-- Future AI readiness stubs (empty tables, no runtime coupling).
CREATE TABLE IF NOT EXISTS public.file_ai_metadata (
  file_id UUID PRIMARY KEY REFERENCES public.files(id) ON DELETE CASCADE,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  model TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.file_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.file_ai_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own file AI metadata"
ON public.file_ai_metadata FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.files f
    WHERE f.id = file_id AND f.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can view own processing jobs"
ON public.file_processing_jobs FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

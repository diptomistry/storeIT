import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Typed wrappers for SECURITY DEFINER RPCs invoked via the service-role client.
 */
export async function reserveStorage(
  admin: SupabaseClient,
  userId: string,
  bytes: number
) {
  return admin.rpc("reserve_storage" as never, {
    p_user_id: userId,
    p_bytes: bytes,
  } as never);
}

export async function releaseReservedStorage(
  admin: SupabaseClient,
  userId: string,
  bytes: number
) {
  return admin.rpc("release_reserved_storage" as never, {
    p_user_id: userId,
    p_bytes: bytes,
  } as never);
}

export async function softDeleteFolderTree(
  admin: SupabaseClient,
  folderId: string,
  userId: string
) {
  return admin.rpc("soft_delete_folder_tree" as never, {
    p_folder_id: folderId,
    p_user_id: userId,
  } as never);
}

export async function restoreFolderTree(
  admin: SupabaseClient,
  folderId: string,
  userId: string
) {
  return admin.rpc("restore_folder_tree" as never, {
    p_folder_id: folderId,
    p_user_id: userId,
  } as never);
}

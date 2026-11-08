import { AppError } from "@/lib/auth/errors";
import type { FileRecord, Folder } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

export async function assertFileOwnership(
  supabase: Client,
  fileId: string,
  userId: string
): Promise<FileRecord> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to verify file ownership", 500, "OWNERSHIP_CHECK_FAILED");
  }

  if (!data) {
    throw new AppError("File not found", 404, "FILE_NOT_FOUND");
  }

  return data as FileRecord;
}

export async function assertFolderOwnership(
  supabase: Client,
  folderId: string,
  userId: string
): Promise<Folder> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to verify folder ownership", 500, "OWNERSHIP_CHECK_FAILED");
  }

  if (!data) {
    throw new AppError("Folder not found", 404, "FOLDER_NOT_FOUND");
  }

  return data as Folder;
}

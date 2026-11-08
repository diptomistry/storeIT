import {
  PREVIEWABLE_MIME_PREFIXES,
  PREVIEWABLE_MIME_TYPES,
} from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFileOwnership } from "@/lib/files/ownership";
import { createClient } from "@/lib/supabase/server";
import { createPresignedPreviewUrl } from "@/lib/storage/download";

type Params = { params: Promise<{ id: string }> };

function isPreviewable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  if (PREVIEWABLE_MIME_TYPES.has(mimeType)) return true;
  return PREVIEWABLE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const file = await assertFileOwnership(supabase, id, user.id);

    if (file.deleted_at) {
      throw new AppError("File is in trash", 400, "FILE_TRASHED");
    }

    if (!isPreviewable(file.mime_type)) {
      throw new AppError("Preview is not available for this file type", 400, "NO_PREVIEW");
    }

    // Never serve HTML as executable content in the app origin.
    const safeMime =
      file.mime_type === "text/html" ? "text/plain" : (file.mime_type ?? "application/octet-stream");

    const { url, expiresIn } = await createPresignedPreviewUrl(file.storage_key, safeMime);

    return jsonOk({
      url,
      mimeType: safeMime,
      name: file.name,
      size: file.size,
      expiresIn,
    });
  } catch (error) {
    return jsonError(error);
  }
}

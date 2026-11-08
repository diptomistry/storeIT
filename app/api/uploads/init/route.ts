import { RATE_LIMITS, UPLOAD_SESSION_TTL_MS } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { ensureRateLimit, jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { releaseReservedStorage, reserveStorage } from "@/lib/supabase/rpc";
import { assertFolderOwnership } from "@/lib/files/ownership";
import { createPresignedUploadUrl } from "@/lib/storage/upload";
import { generateStorageKey, validateUploadRequest } from "@/lib/storage/validation";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { uploadInitSchema } from "@/lib/validations/files";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const rate = checkRateLimit(
      `upload-init:${user.id}`,
      RATE_LIMITS.uploadInit.limit,
      RATE_LIMITS.uploadInit.windowMs
    );
    ensureRateLimit(`upload-init:${user.id}`, rate.allowed, rate.retryAfterMs);

    const body = uploadInitSchema.parse(await request.json());
    const validated = validateUploadRequest({
      name: body.name,
      size: body.size,
      mimeType: body.mimeType,
    });

    const supabase = await createClient();
    const folderId = body.folderId ?? null;

    if (folderId) {
      const folder = await assertFolderOwnership(supabase, folderId, user.id);
      if (folder.deleted_at) {
        throw new AppError("Cannot upload into a deleted folder", 400, "FOLDER_DELETED");
      }
    }

    const admin = createAdminClient();
    const storageKey = generateStorageKey(user.id);
    const expiresAt = new Date(Date.now() + UPLOAD_SESSION_TTL_MS).toISOString();

    const { error: reserveError } = await reserveStorage(admin, user.id, body.size);

    if (reserveError) {
      throw new AppError(
        reserveError.message.includes("Insufficient")
          ? "Insufficient storage quota"
          : "Unable to reserve storage",
        400,
        "QUOTA_EXCEEDED"
      );
    }

    const { data: session, error: sessionError } = await admin
      .from("upload_sessions")
      .insert({
        user_id: user.id,
        storage_key: storageKey,
        original_name: validated.sanitizedName,
        mime_type: validated.mimeType,
        expected_size: body.size,
        status: "pending",
        expires_at: expiresAt,
        folder_id: folderId,
      })
      .select("*")
      .single();

    if (sessionError || !session) {
      await releaseReservedStorage(admin, user.id, body.size);
      throw new AppError("Unable to create upload session", 500, "SESSION_CREATE_FAILED");
    }

    const { uploadUrl, expiresIn } = await createPresignedUploadUrl(
      storageKey,
      validated.mimeType
    );

    return jsonOk({
      sessionId: session.id,
      uploadUrl,
      storageKey,
      expiresAt,
      expiresIn,
    });
  } catch (error) {
    return jsonError(error);
  }
}

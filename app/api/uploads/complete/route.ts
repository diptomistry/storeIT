import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { resolveUniqueFilename } from "@/lib/files/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { releaseReservedStorage } from "@/lib/supabase/rpc";
import { deleteObject } from "@/lib/storage/delete";
import { verifyUploadedObject } from "@/lib/storage/upload";
import { getExtension } from "@/lib/storage/validation";
import { uploadCompleteSchema } from "@/lib/validations/files";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { sessionId } = uploadCompleteSchema.parse(await request.json());

    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from("upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError || !session) {
      throw new AppError("Upload session not found", 404, "SESSION_NOT_FOUND");
    }

    if (session.status !== "pending") {
      throw new AppError("Upload session is no longer pending", 400, "SESSION_INVALID");
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      await admin
        .from("upload_sessions")
        .update({ status: "expired" })
        .eq("id", session.id);
      await releaseReservedStorage(admin, user.id, session.expected_size);
      throw new AppError("Upload session expired", 400, "SESSION_EXPIRED");
    }

    try {
      const object = await verifyUploadedObject(session.storage_key, session.expected_size);
      const supabase = await createClient();
      const folderId = session.folder_id ?? null;
      const displayName = await resolveUniqueFilename(
        supabase,
        user.id,
        folderId,
        session.original_name
      );

      const { data: file, error: insertError } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          folder_id: folderId,
          name: displayName,
          original_name: session.original_name,
          storage_key: session.storage_key,
          mime_type: session.mime_type ?? object.contentType,
          extension: getExtension(session.original_name),
          size: session.expected_size,
          checksum: object.etag,
        })
        .select("*")
        .single();

      if (insertError || !file) {
        throw new AppError("Unable to save file metadata", 500, "METADATA_SAVE_FAILED");
      }

      await admin
        .from("upload_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", session.id);

      await releaseReservedStorage(admin, user.id, session.expected_size);

      return jsonOk(file);
    } catch (error) {
      await admin
        .from("upload_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);

      await releaseReservedStorage(admin, user.id, session.expected_size);

      try {
        await deleteObject(session.storage_key);
      } catch {
        // Best-effort cleanup of orphaned object
      }

      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}

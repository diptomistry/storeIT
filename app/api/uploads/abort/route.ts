import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseReservedStorage } from "@/lib/supabase/rpc";
import { deleteObject } from "@/lib/storage/delete";
import { uploadAbortSchema } from "@/lib/validations/files";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { sessionId } = uploadAbortSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: session, error } = await admin
      .from("upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !session) {
      throw new AppError("Upload session not found", 404, "SESSION_NOT_FOUND");
    }

    if (session.status === "pending") {
      await admin
        .from("upload_sessions")
        .update({ status: "failed" })
        .eq("id", session.id);

      await releaseReservedStorage(admin, user.id, session.expected_size);

      try {
        await deleteObject(session.storage_key);
      } catch {
        // Object may not exist yet
      }
    }

    return jsonOk({ aborted: true });
  } catch (error) {
    return jsonError(error);
  }
}

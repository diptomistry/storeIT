import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFileOwnership } from "@/lib/files/ownership";
import { createClient } from "@/lib/supabase/server";
import { deleteObject } from "@/lib/storage/delete";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const file = await assertFileOwnership(supabase, id, user.id);

    // Delete object first to avoid orphaned billable storage if DB delete succeeds but R2 fails later.
    try {
      await deleteObject(file.storage_key);
    } catch (error) {
      console.error("R2 delete failed for", file.id, error instanceof Error ? error.message : error);
      throw new AppError("Unable to delete file from storage", 500, "STORAGE_DELETE_FAILED");
    }

    const { error } = await supabase
      .from("files")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "DB delete failed after R2 delete; orphaned object may need cleanup:",
        file.storage_key
      );
      throw new AppError("Unable to delete file metadata", 500, "METADATA_DELETE_FAILED");
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}

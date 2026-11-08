import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFileOwnership, assertFolderOwnership } from "@/lib/files/ownership";
import { createClient } from "@/lib/supabase/server";
import { sanitizeFilename } from "@/lib/storage/validation";
import { updateFileSchema } from "@/lib/validations/files";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const file = await assertFileOwnership(supabase, id, user.id);
    return jsonOk(file);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = updateFileSchema.parse(await request.json());
    const supabase = await createClient();
    const file = await assertFileOwnership(supabase, id, user.id);

    if (file.deleted_at) {
      throw new AppError("Restore the file before modifying it", 400, "FILE_TRASHED");
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.name = sanitizeFilename(body.name);
    }

    if (body.isStarred !== undefined) {
      updates.is_starred = body.isStarred;
    }

    if (body.folderId !== undefined) {
      if (body.folderId) {
        const folder = await assertFolderOwnership(supabase, body.folderId, user.id);
        if (folder.deleted_at) {
          throw new AppError("Cannot move into a deleted folder", 400, "FOLDER_DELETED");
        }
      }
      updates.folder_id = body.folderId;
    }

    const { data, error } = await supabase
      .from("files")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError("Unable to update file", 500, "UPDATE_FAILED");
    }

    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    await assertFileOwnership(supabase, id, user.id);

    const { data, error } = await supabase
      .from("files")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError("Unable to delete file", 500, "DELETE_FAILED");
    }

    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}

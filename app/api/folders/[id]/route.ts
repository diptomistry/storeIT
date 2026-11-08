import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFolderOwnership } from "@/lib/files/ownership";
import { createAdminClient } from "@/lib/supabase/admin";
import { softDeleteFolderTree } from "@/lib/supabase/rpc";
import { createClient } from "@/lib/supabase/server";
import { updateFolderSchema } from "@/lib/validations/folders";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const folder = await assertFolderOwnership(supabase, id, user.id);
    return jsonOk(folder);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = updateFolderSchema.parse(await request.json());
    const supabase = await createClient();
    const folder = await assertFolderOwnership(supabase, id, user.id);

    if (folder.deleted_at) {
      throw new AppError("Restore the folder before modifying it", 400, "FOLDER_TRASHED");
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.name = body.name.trim();
    }

    if (body.parentId !== undefined) {
      if (body.parentId === id) {
        throw new AppError("Cannot move a folder into itself", 400, "INVALID_PARENT");
      }
      if (body.parentId) {
        const parent = await assertFolderOwnership(supabase, body.parentId, user.id);
        if (parent.deleted_at) {
          throw new AppError("Cannot move into a deleted folder", 400, "FOLDER_DELETED");
        }
      }
      updates.parent_id = body.parentId;
    }

    const { data, error } = await supabase
      .from("folders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      const message = error?.message?.includes("Cannot move a folder into itself")
        ? "Cannot move a folder into itself or its descendants"
        : "Unable to update folder";
      throw new AppError(message, 400, "UPDATE_FAILED");
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
    await assertFolderOwnership(supabase, id, user.id);

    const admin = createAdminClient();
    const { error } = await softDeleteFolderTree(admin, id, user.id);

    if (error) {
      throw new AppError("Unable to delete folder", 500, "DELETE_FAILED");
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}

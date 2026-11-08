import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFolderOwnership } from "@/lib/files/ownership";
import { listFolders } from "@/lib/files/queries";
import { createClient } from "@/lib/supabase/server";
import { createFolderSchema } from "@/lib/validations/folders";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get("parentId");
    const trashed = searchParams.get("trashed") === "true";
    const parentId =
      parentIdParam === null || parentIdParam === "" || parentIdParam === "root"
        ? null
        : parentIdParam;

    const supabase = await createClient();
    const folders = await listFolders(supabase, user.id, { parentId, trashed });
    return jsonOk(folders);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createFolderSchema.parse(await request.json());
    const supabase = await createClient();
    const parentId = body.parentId ?? null;

    if (parentId) {
      const parent = await assertFolderOwnership(supabase, parentId, user.id);
      if (parent.deleted_at) {
        throw new AppError("Cannot create folder inside trash", 400, "FOLDER_DELETED");
      }
    }

    const { data, error } = await supabase
      .from("folders")
      .insert({
        user_id: user.id,
        parent_id: parentId,
        name: body.name.trim(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError("Unable to create folder", 500, "CREATE_FAILED");
    }

    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error);
  }
}

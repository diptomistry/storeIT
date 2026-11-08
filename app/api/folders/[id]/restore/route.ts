import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFolderOwnership } from "@/lib/files/ownership";
import { createAdminClient } from "@/lib/supabase/admin";
import { restoreFolderTree } from "@/lib/supabase/rpc";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const folder = await assertFolderOwnership(supabase, id, user.id);

    if (!folder.deleted_at) {
      throw new AppError("Folder is not in trash", 400, "NOT_TRASHED");
    }

    const admin = createAdminClient();
    const { error } = await restoreFolderTree(admin, id, user.id);

    if (error) {
      throw new AppError("Unable to restore folder", 500, "RESTORE_FAILED");
    }

    return jsonOk({ restored: true });
  } catch (error) {
    return jsonError(error);
  }
}

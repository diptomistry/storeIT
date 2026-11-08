import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/auth/errors";
import { jsonError, jsonOk } from "@/lib/api";
import { assertFileOwnership } from "@/lib/files/ownership";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const file = await assertFileOwnership(supabase, id, user.id);

    if (!file.deleted_at) {
      throw new AppError("File is not in trash", 400, "NOT_TRASHED");
    }

    const { data, error } = await supabase
      .from("files")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new AppError("Unable to restore file", 500, "RESTORE_FAILED");
    }

    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}

import { requireUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api";
import { getBreadcrumb } from "@/lib/files/queries";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const breadcrumb = await getBreadcrumb(supabase, user.id, id === "root" ? null : id);
    return jsonOk(breadcrumb);
  } catch (error) {
    return jsonError(error);
  }
}

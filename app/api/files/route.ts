import { requireUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api";
import { listFiles } from "@/lib/files/queries";
import { createClient } from "@/lib/supabase/server";
import { searchFilesSchema } from "@/lib/validations/files";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const folderParam = searchParams.get("folderId");
    const parsed = searchFilesSchema.parse({
      q: searchParams.get("q") ?? undefined,
      mimeType: searchParams.get("mimeType") ?? undefined,
      folderId:
        folderParam && folderParam !== "root" && folderParam !== "null"
          ? folderParam
          : undefined,
      starred: searchParams.get("starred") ?? undefined,
      trashed: searchParams.get("trashed") ?? undefined,
      recent: searchParams.get("recent") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    });

    const supabase = await createClient();
    const resolvedFolderId =
      folderParam === null
        ? undefined
        : folderParam === "root" || folderParam === "" || folderParam === "null"
          ? null
          : folderParam;

    const files = await listFiles(supabase, user.id, {
      ...parsed,
      search: parsed.q,
      folderId: resolvedFolderId,
    });

    return jsonOk(files);
  } catch (error) {
    return jsonError(error);
  }
}

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import {
  getBreadcrumb,
  getDashboardStats,
  getStorageUsage,
  listFiles,
  listFolders,
} from "@/lib/files/queries";
import { DEFAULT_QUOTA_BYTES } from "@/lib/constants";
import type { FileRecord, Profile } from "@/types/database";

export async function getShellContext(folderId: string | null = null) {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, storage, breadcrumb] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getStorageUsage(supabase, user.id),
    getBreadcrumb(supabase, user.id, folderId),
  ]);

  return {
    user,
    profile: profile as Profile | null,
    usedBytes: storage?.used_bytes ?? 0,
    quotaBytes: storage?.quota_bytes ?? DEFAULT_QUOTA_BYTES,
    breadcrumb,
  };
}

export async function loadFilesPage(folderId: string | null) {
  const ctx = await getShellContext(folderId);
  const supabase = await createClient();
  const [folders, files] = await Promise.all([
    listFolders(supabase, ctx.user.id, { parentId: folderId }),
    listFiles(supabase, ctx.user.id, { folderId }),
  ]);
  return { ...ctx, folders, files };
}

export async function loadRecentPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const files = await listFiles(supabase, ctx.user.id, {
    recent: true,
    sortBy: "updated_at",
    sortOrder: "desc",
  });
  return { ...ctx, files };
}

export async function loadStarredPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const files = await listFiles(supabase, ctx.user.id, { starred: true });
  return { ...ctx, files };
}

export async function loadTrashPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const [folders, files] = await Promise.all([
    listFolders(supabase, ctx.user.id, { trashed: true }),
    listFiles(supabase, ctx.user.id, { trashed: true }),
  ]);
  return { ...ctx, folders, files };
}

export async function loadDashboardPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const stats = await getDashboardStats(supabase, ctx.user.id);
  return { ...ctx, stats };
}

export async function loadStoragePage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data: files } = await supabase
    .from("files")
    .select("id, name, size, mime_type, created_at, updated_at")
    .eq("user_id", ctx.user.id)
    .is("deleted_at", null)
    .order("size", { ascending: false });

  const allFiles = (files ?? []) as Pick<
    FileRecord,
    "id" | "name" | "size" | "mime_type" | "created_at" | "updated_at"
  >[];
  const breakdown = new Map<string, number>();

  for (const file of allFiles) {
    const key = file.mime_type?.split("/")[0] ?? "other";
    breakdown.set(key, (breakdown.get(key) ?? 0) + file.size);
  }

  return {
    ...ctx,
    largestFiles: allFiles.slice(0, 10),
    recentUploads: [...allFiles]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10),
    breakdown: Array.from(breakdown.entries()).map(([type, bytes]) => ({ type, bytes })),
  };
}

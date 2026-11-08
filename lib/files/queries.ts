import type { FileRecord, Folder, UserStorageUsage } from "@/types/database";
import type { FileListFilters } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

export async function listFolders(
  supabase: Client,
  userId: string,
  options: { parentId?: string | null; trashed?: boolean } = {}
): Promise<Folder[]> {
  let query = supabase.from("folders").select("*").eq("user_id", userId);

  if (options.trashed) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (options.parentId === null || options.parentId === undefined) {
    if (!options.trashed) {
      query = query.is("parent_id", null);
    }
  } else {
    query = query.eq("parent_id", options.parentId);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Folder[];
}

export async function listFiles(
  supabase: Client,
  userId: string,
  filters: FileListFilters = {}
): Promise<FileRecord[]> {
  let query = supabase.from("files").select("*").eq("user_id", userId);

  if (filters.trashed) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (filters.starred) {
    query = query.eq("is_starred", true);
  }

  if (filters.folderId !== undefined && !filters.recent && !filters.starred && !filters.trashed) {
    if (filters.folderId === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", filters.folderId);
    }
  }

  if (filters.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  if (filters.mimeType?.trim()) {
    query = query.ilike("mime_type", `${filters.mimeType.trim()}%`);
  }

  const sortBy = filters.sortBy ?? (filters.recent ? "updated_at" : "name");
  const ascending = (filters.sortOrder ?? (filters.recent ? "desc" : "asc")) === "asc";

  if (filters.recent) {
    query = query.order("updated_at", { ascending: false }).limit(50);
  } else {
    query = query.order(sortBy, { ascending });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FileRecord[];
}

export async function getStorageUsage(
  supabase: Client,
  userId: string
): Promise<UserStorageUsage | null> {
  const { data, error } = await supabase
    .from("user_storage_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as UserStorageUsage | null) ?? null;
}

export async function getDashboardStats(supabase: Client, userId: string) {
  const [filesRes, foldersRes, storage, recentFiles] = await Promise.all([
    supabase
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    supabase
      .from("folders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null),
    getStorageUsage(supabase, userId),
    listFiles(supabase, userId, { recent: true, sortBy: "updated_at", sortOrder: "desc" }),
  ]);

  return {
    totalFiles: (filesRes.count as number | null) ?? 0,
    totalFolders: (foldersRes.count as number | null) ?? 0,
    storage,
    recentFiles: recentFiles.slice(0, 8),
  };
}

export async function getBreadcrumb(
  supabase: Client,
  userId: string,
  folderId: string | null
): Promise<{ id: string | null; name: string }[]> {
  const trail: { id: string | null; name: string }[] = [{ id: null, name: "My Files" }];
  if (!folderId) return trail;

  const chain: { id: string; name: string; parent_id: string | null }[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data, error } = await supabase
      .from("folders")
      .select("id, name, parent_id")
      .eq("id", currentId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) break;

    const row = data as { id: string; name: string; parent_id: string | null };
    chain.unshift({ id: row.id, name: row.name, parent_id: row.parent_id });
    currentId = row.parent_id;
  }

  return [...trail, ...chain.map((c) => ({ id: c.id, name: c.name }))];
}

export async function resolveUniqueFilename(
  supabase: Client,
  userId: string,
  folderId: string | null,
  desiredName: string
): Promise<string> {
  let query = supabase
    .from("files")
    .select("name")
    .eq("user_id", userId)
    .is("deleted_at", null);

  query = folderId === null ? query.is("folder_id", null) : query.eq("folder_id", folderId);

  const { data: existing, error } = await query;
  if (error) throw error;

  const names = new Set(
    ((existing as { name: string }[] | null) ?? []).map((f) => f.name.toLowerCase())
  );
  if (!names.has(desiredName.toLowerCase())) return desiredName;

  const extIndex = desiredName.lastIndexOf(".");
  const base = extIndex > 0 ? desiredName.slice(0, extIndex) : desiredName;
  const ext = extIndex > 0 ? desiredName.slice(extIndex) : "";

  let i = 1;
  while (i < 10_000) {
    const candidate = `${base} (${i})${ext}`;
    if (!names.has(candidate.toLowerCase())) return candidate;
    i += 1;
  }

  return `${base}-${Date.now()}${ext}`;
}

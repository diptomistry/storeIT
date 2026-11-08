export type {
  Profile,
  Folder,
  FileRecord,
  UserStorageUsage,
  UploadSession,
  UploadSessionStatus,
  Database,
} from "./database";

export type ViewMode = "grid" | "list";

export type SortField = "name" | "updated_at" | "size" | "mime_type";

export type SortOrder = "asc" | "desc";

export type FileListFilters = {
  folderId?: string | null;
  search?: string;
  mimeType?: string;
  starred?: boolean;
  trashed?: boolean;
  recent?: boolean;
  sortBy?: SortField;
  sortOrder?: SortOrder;
};

export type BreadcrumbItem = {
  id: string | null;
  name: string;
};

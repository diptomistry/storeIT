export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type FileRecord = {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  original_name: string;
  storage_key: string;
  mime_type: string | null;
  extension: string | null;
  size: number;
  checksum: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type UserStorageUsage = {
  user_id: string;
  used_bytes: number;
  reserved_bytes: number;
  quota_bytes: number;
  updated_at: string;
};

export type UploadSessionStatus = "pending" | "completed" | "failed" | "expired";

export type UploadSession = {
  id: string;
  user_id: string;
  storage_key: string;
  original_name: string;
  mime_type: string | null;
  expected_size: number;
  status: UploadSessionStatus;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
  folder_id: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, "id" | "created_at" | "updated_at" | "deleted_at"> & {
          id?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Folder>;
      };
      files: {
        Row: FileRecord;
        Insert: Omit<FileRecord, "id" | "created_at" | "updated_at" | "deleted_at" | "is_starred"> & {
          id?: string;
          is_starred?: boolean;
          deleted_at?: string | null;
        };
        Update: Partial<FileRecord>;
      };
      user_storage_usage: {
        Row: UserStorageUsage;
        Insert: Partial<UserStorageUsage> & { user_id: string };
        Update: Partial<UserStorageUsage>;
      };
      upload_sessions: {
        Row: UploadSession;
        Insert: Omit<UploadSession, "id" | "created_at" | "completed_at" | "status"> & {
          id?: string;
          status?: UploadSessionStatus;
          completed_at?: string | null;
        };
        Update: Partial<UploadSession>;
      };
    };
  };
};

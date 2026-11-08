import { z } from "zod";

import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export const uploadInitSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  mimeType: z.string().min(1).max(255),
  folderId: z.string().uuid().nullable().optional(),
});

export const uploadCompleteSchema = z.object({
  sessionId: z.string().uuid(),
});

export const uploadAbortSchema = z.object({
  sessionId: z.string().uuid(),
});

export const renameFileSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const moveFileSchema = z.object({
  folderId: z.string().uuid().nullable(),
});

export const updateFileSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    folderId: z.string().uuid().nullable().optional(),
    isStarred: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.folderId !== undefined || data.isStarred !== undefined, {
    message: "At least one field is required",
  });

export const searchFilesSchema = z.object({
  q: z.string().trim().max(200).optional(),
  mimeType: z.string().max(255).optional(),
  folderId: z.string().uuid().nullable().optional(),
  starred: z.coerce.boolean().optional(),
  trashed: z.coerce.boolean().optional(),
  recent: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "updated_at", "size", "mime_type"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

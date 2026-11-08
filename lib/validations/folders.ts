import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100),
  parentId: z.string().uuid().nullable().optional(),
});

export const renameFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const moveFolderSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

export const updateFolderSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    parentId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.parentId !== undefined, {
    message: "At least one field is required",
  });

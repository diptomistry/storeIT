import { randomUUID } from "crypto";

import {
  ALL_ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import { AppError } from "@/lib/auth/errors";

const DANGEROUS_NAME_PATTERN = /(\.\.|\/|\\|[\u0000-\u001f])/;

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const base = trimmed.split(/[/\\]/).pop() ?? trimmed;
  const cleaned = base.replace(/[<>:"|?*\u0000-\u001f]/g, "_").slice(0, 255);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new AppError("Invalid file name", 400, "INVALID_FILENAME");
  }
  return cleaned;
}

export function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts.at(-1) ?? "";
}

export function generateStorageKey(userId: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `users/${userId}/${yyyy}/${mm}/${randomUUID()}`;
}

export function validateUploadRequest(input: {
  name: string;
  size: number;
  mimeType: string;
}) {
  if (!Number.isFinite(input.size) || input.size <= 0) {
    throw new AppError("Invalid file size", 400, "INVALID_SIZE");
  }

  if (input.size > MAX_UPLOAD_BYTES) {
    throw new AppError(
      `File exceeds maximum size of ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB`,
      400,
      "FILE_TOO_LARGE"
    );
  }

  if (DANGEROUS_NAME_PATTERN.test(input.name)) {
    throw new AppError("File name contains invalid characters", 400, "INVALID_FILENAME");
  }

  const sanitized = sanitizeFilename(input.name);
  const extension = getExtension(sanitized);

  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new AppError("File type is not allowed", 400, "INVALID_EXTENSION");
  }

  const mimeType = input.mimeType.toLowerCase().trim();
  if (!ALL_ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError("MIME type is not allowed", 400, "INVALID_MIME");
  }

  return { sanitizedName: sanitized, extension, mimeType };
}

/** Basic magic-byte sniffing for common formats. Returns null if unknown. */
export function sniffMimeFromMagicBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "application/zip";
  }

  return null;
}

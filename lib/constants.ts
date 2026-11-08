/** Default per-user quota: 1 GiB */
export const DEFAULT_QUOTA_BYTES = 1_073_741_824;

/** Maximum single-file upload size: 100 MiB */
export const MAX_UPLOAD_BYTES = 104_857_600;

export const PRESIGN_UPLOAD_EXPIRES_SECONDS = 300;
export const PRESIGN_DOWNLOAD_EXPIRES_SECONDS = 120;
export const PRESIGN_PREVIEW_EXPIRES_SECONDS = 60;

export const UPLOAD_SESSION_TTL_MS = 15 * 60 * 1000;

export const ALLOWED_MIME_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  text: [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/xml",
    "text/xml",
  ],
  archives: [
    "application/zip",
    "application/x-zip-compressed",
    "application/gzip",
    "application/x-tar",
  ],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
} as const;

export const ALL_ALLOWED_MIME_TYPES = new Set<string>(
  Object.values(ALLOWED_MIME_TYPES).flat()
);

export const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "html",
  "css",
  "js",
  "ts",
  "tsx",
  "jsx",
  "xml",
  "zip",
  "gz",
  "tar",
  "mp3",
  "wav",
  "ogg",
  "mp4",
  "webm",
  "mov",
]);

export const PREVIEWABLE_MIME_PREFIXES = ["image/", "text/"] as const;
export const PREVIEWABLE_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "text/markdown",
]);

export const RATE_LIMITS = {
  uploadInit: { limit: 30, windowMs: 60_000 },
  download: { limit: 60, windowMs: 60_000 },
  auth: { limit: 20, windowMs: 60_000 },
} as const;

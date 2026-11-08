import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import {
  generateStorageKey,
  getExtension,
  sanitizeFilename,
  sniffMimeFromMagicBytes,
  validateUploadRequest,
} from "@/lib/storage/validation";
import { AppError } from "@/lib/auth/errors";
import { checkRateLimit, resetRateLimits } from "@/lib/utils/rate-limit";

describe("sanitizeFilename", () => {
  it("strips path segments and control characters", () => {
    expect(sanitizeFilename("../../etc/passwd.txt")).toBe("passwd.txt");
    expect(sanitizeFilename("my file.pdf")).toBe("my file.pdf");
  });

  it("rejects empty dangerous names", () => {
    expect(() => sanitizeFilename("..")).toThrow(AppError);
  });
});

describe("validateUploadRequest", () => {
  it("accepts valid uploads", () => {
    const result = validateUploadRequest({
      name: "photo.jpg",
      size: 1024,
      mimeType: "image/jpeg",
    });
    expect(result.extension).toBe("jpg");
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("rejects oversized files", () => {
    expect(() =>
      validateUploadRequest({
        name: "big.pdf",
        size: MAX_UPLOAD_BYTES + 1,
        mimeType: "application/pdf",
      })
    ).toThrow(/maximum size/i);
  });

  it("rejects disallowed mime types", () => {
    expect(() =>
      validateUploadRequest({
        name: "evil.exe",
        size: 100,
        mimeType: "application/x-msdownload",
      })
    ).toThrow(AppError);
  });

  it("rejects path traversal in names", () => {
    expect(() =>
      validateUploadRequest({
        name: "../secret.png",
        size: 100,
        mimeType: "image/png",
      })
    ).toThrow(AppError);
  });
});

describe("generateStorageKey", () => {
  it("creates opaque keys scoped to the user", () => {
    const key = generateStorageKey("user-123");
    expect(key.startsWith("users/user-123/")).toBe(true);
    expect(key.includes("..")).toBe(false);
    expect(getExtension(key)).toBe("");
  });
});

describe("sniffMimeFromMagicBytes", () => {
  it("detects PNG and PDF signatures", () => {
    expect(sniffMimeFromMagicBytes(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBe(
      "image/png"
    );
    expect(sniffMimeFromMagicBytes(Uint8Array.from([0x25, 0x50, 0x44, 0x46]))).toBe(
      "application/pdf"
    );
  });
});

describe("checkRateLimit", () => {
  it("blocks after the configured limit", () => {
    resetRateLimits();
    const key = "test-limit";
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);
  });
});

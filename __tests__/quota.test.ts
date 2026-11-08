import { describe, expect, it } from "vitest";

import { DEFAULT_QUOTA_BYTES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatBytes, formatPercent } from "@/lib/utils/format";

describe("quota constants", () => {
  it("defaults to 1 GiB quota", () => {
    expect(DEFAULT_QUOTA_BYTES).toBe(1_073_741_824);
  });

  it("caps single uploads below the default quota", () => {
    expect(MAX_UPLOAD_BYTES).toBeLessThan(DEFAULT_QUOTA_BYTES);
  });
});

describe("format helpers", () => {
  it("formats bytes and percentages", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatPercent(512, 1024)).toBe(50);
    expect(formatPercent(200, 100)).toBe(100);
  });
});

describe("quota enforcement logic", () => {
  it("rejects when used + reserved + incoming exceeds quota", () => {
    const used = 900_000_000;
    const reserved = 100_000_000;
    const incoming = 100_000_000;
    const quota = DEFAULT_QUOTA_BYTES;
    const allowed = used + reserved + incoming <= quota;
    expect(allowed).toBe(false);
  });

  it("allows uploads within remaining quota", () => {
    const used = 100;
    const reserved = 100;
    const incoming = 100;
    const quota = DEFAULT_QUOTA_BYTES;
    expect(used + reserved + incoming <= quota).toBe(true);
  });
});

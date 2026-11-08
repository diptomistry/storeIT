import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/auth/errors";
import { assertFileOwnership, assertFolderOwnership } from "@/lib/files/ownership";

function mockClient(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  return {
    from: vi.fn().mockReturnValue({ select }),
  } as never;
}

describe("ownership checks", () => {
  it("returns the file when ownership matches", async () => {
    const file = { id: "f1", user_id: "u1", name: "a.txt" };
    const client = mockClient({ data: file, error: null });
    await expect(assertFileOwnership(client, "f1", "u1")).resolves.toEqual(file);
  });

  it("throws when file is missing for the user", async () => {
    const client = mockClient({ data: null, error: null });
    await expect(assertFileOwnership(client, "f1", "u1")).rejects.toBeInstanceOf(AppError);
  });

  it("throws when folder is missing for the user", async () => {
    const client = mockClient({ data: null, error: null });
    await expect(assertFolderOwnership(client, "folder", "u1")).rejects.toMatchObject({
      code: "FOLDER_NOT_FOUND",
    });
  });
});

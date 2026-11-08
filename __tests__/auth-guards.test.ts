import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/auth/errors";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { uploadInitSchema } from "@/lib/validations/files";

describe("auth validation", () => {
  it("requires a valid email and password on login", () => {
    expect(loginSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "password1" }).success
    ).toBe(true);
  });

  it("requires matching passwords on register", () => {
    const result = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
  });
});

describe("presigned upload authorization inputs", () => {
  it("requires authenticated session semantics via server-only user id (not client userId)", () => {
    const parsed = uploadInitSchema.safeParse({
      name: "doc.pdf",
      size: 2048,
      mimeType: "application/pdf",
      folderId: null,
    });
    expect(parsed.success).toBe(true);
    expect("userId" in (parsed.data as object)).toBe(false);
  });

  it("uses AppError codes suitable for unauthorized access", () => {
    const error = new AppError("Authentication required", 401, "UNAUTHORIZED");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });
});

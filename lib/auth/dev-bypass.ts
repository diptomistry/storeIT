import { timingSafeEqual } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DEV_BYPASS_EMAIL = "dev@storeit.local";

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isDevModeEnabled(): boolean {
  return parseBool(process.env.DEV_MODE);
}

export function getDevBypassSecret(): string | null {
  const secret = process.env.DEV_BYPASS_SECRET?.trim();
  return secret || null;
}

export function isDevBypassSecretValid(candidate: string): boolean {
  if (!isDevModeEnabled()) return false;

  const expected = getDevBypassSecret();
  if (!expected || !candidate) return false;

  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

/**
 * Creates or updates a confirmed local-only user, then establishes a real session.
 * Only call after isDevBypassSecretValid() succeeds.
 */
export async function signInWithDevBypass() {
  if (!isDevModeEnabled()) {
    throw new Error("Dev mode is disabled");
  }

  const secret = getDevBypassSecret();
  if (!secret) {
    throw new Error("DEV_BYPASS_SECRET is not configured");
  }

  const password = `StoreIt-Dev-${secret}`;
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: DEV_BYPASS_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Dev User" },
  });

  if (createError) {
    const alreadyExists =
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("registered") ||
      createError.status === 422;

    if (!alreadyExists) {
      throw new Error(createError.message);
    }

    const { data: listed, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (listError) {
      throw new Error(listError.message);
    }

    const existing = listed.users.find(
      (user) => user.email?.toLowerCase() === DEV_BYPASS_EMAIL
    );

    if (!existing) {
      throw new Error("Dev bypass user exists but could not be located");
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: "Dev User" },
    });

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else if (!created.user) {
    throw new Error("Unable to create dev bypass user");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEV_BYPASS_EMAIL,
    password,
  });

  if (signInError) {
    throw new Error(signInError.message);
  }
}

export function isPublicDevModeEnabled(): boolean {
  return parseBool(process.env.NEXT_PUBLIC_DEV_MODE);
}

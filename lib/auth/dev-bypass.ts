import { timingSafeEqual } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DEMO_USER_EMAIL = "dev@storeit.local";

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function isDevModeEnabled(): boolean {
  return parseBool(process.env.DEV_MODE);
}

export function getDemoAccessKey(): string | null {
  const key =
    process.env.DEMO_ACCESS_KEY?.trim() ||
    process.env.DEV_BYPASS_SECRET?.trim(); // backwards-compatible alias
  return key || null;
}

export function isDemoAccessKeyValid(candidate: string): boolean {
  if (!isDevModeEnabled()) return false;

  const expected = getDemoAccessKey();
  if (!expected || !candidate) return false;

  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

/**
 * Creates or updates a confirmed local-only user, then establishes a real session.
 * Only call after isDemoAccessKeyValid() succeeds.
 */
export async function signInWithDemoAccess() {
  if (!isDevModeEnabled()) {
    throw new Error("Dev mode is disabled");
  }

  const accessKey = getDemoAccessKey();
  if (!accessKey) {
    throw new Error("DEMO_ACCESS_KEY is not configured");
  }

  const password = `StoreIt-Dev-${accessKey}`;
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: DEMO_USER_EMAIL,
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
      (user) => user.email?.toLowerCase() === DEMO_USER_EMAIL
    );

    if (!existing) {
      throw new Error("Demo user exists but could not be located");
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
    throw new Error("Unable to create demo user");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_USER_EMAIL,
    password,
  });

  if (signInError) {
    throw new Error(signInError.message);
  }
}

export function isPublicDevModeEnabled(): boolean {
  return parseBool(process.env.NEXT_PUBLIC_DEV_MODE);
}

/** @deprecated Use isDemoAccessKeyValid */
export const isDevBypassSecretValid = isDemoAccessKeyValid;
/** @deprecated Use signInWithDemoAccess */
export const signInWithDevBypass = signInWithDemoAccess;

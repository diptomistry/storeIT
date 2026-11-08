import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/auth/errors";

export type AuthUser = {
  id: string;
  email: string | undefined;
};

export async function getSessionUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return user;
}

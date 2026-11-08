import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

/**
 * Service-role client for privileged server operations only.
 * ALWAYS verify the user session and ownership before using this client.
 * Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  const env = getServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

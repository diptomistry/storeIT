import { RATE_LIMITS } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { ensureRateLimit, jsonError, jsonOk } from "@/lib/api";
import { assertFileOwnership } from "@/lib/files/ownership";
import { createClient } from "@/lib/supabase/server";
import { createPresignedDownloadUrl } from "@/lib/storage/download";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { AppError } from "@/lib/auth/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const rate = checkRateLimit(
      `download:${user.id}`,
      RATE_LIMITS.download.limit,
      RATE_LIMITS.download.windowMs
    );
    ensureRateLimit(`download:${user.id}`, rate.allowed, rate.retryAfterMs);

    const supabase = await createClient();
    const file = await assertFileOwnership(supabase, id, user.id);

    if (file.deleted_at) {
      throw new AppError("File is in trash", 400, "FILE_TRASHED");
    }

    const { url, expiresIn } = await createPresignedDownloadUrl(
      file.storage_key,
      file.original_name
    );

    return jsonOk({ url, filename: file.original_name, expiresIn });
  } catch (error) {
    return jsonError(error);
  }
}

import { NextResponse } from "next/server";

import { AppError, toErrorResponse } from "@/lib/auth/errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(error: unknown) {
  const payload = toErrorResponse(error);
  return NextResponse.json(
    { error: payload.error, code: payload.code },
    { status: payload.status }
  );
}

export function ensureRateLimit(
  key: string,
  allowed: boolean,
  retryAfterMs: number
) {
  if (!allowed) {
    throw new AppError(
      `Too many requests. Try again in ${Math.ceil(retryAfterMs / 1000)}s`,
      429,
      "RATE_LIMITED"
    );
  }
}

import { ZodError } from "zod";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      status: error.statusCode,
    };
  }

  if (error instanceof ZodError) {
    return {
      error: error.issues[0]?.message ?? "Invalid request",
      code: "VALIDATION_ERROR",
      status: 400,
    };
  }

  console.error("Unexpected error:", error instanceof Error ? error.message : "unknown");
  return {
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
    status: 500,
  };
}

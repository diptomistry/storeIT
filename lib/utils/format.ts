import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  const digits = i === 0 || value >= 10 || Number.isInteger(value) ? 0 : decimals;
  return `${value.toFixed(digits)} ${units[i]}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, "MMM d, yyyy h:mm a");
}

export function formatRelativeDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatPercent(used: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 1000) / 10);
}

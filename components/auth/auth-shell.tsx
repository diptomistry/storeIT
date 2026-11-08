import Link from "next/link";
import { HardDrive } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2.5 self-start">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HardDrive className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-slate-900">Store It</span>
        </Link>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

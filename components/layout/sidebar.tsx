"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  HardDrive,
  LayoutDashboard,
  Settings,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatBytes, formatPercent } from "@/lib/utils/format";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/files", label: "My Files", icon: HardDrive },
  { href: "/recent", label: "Recent", icon: Clock3 },
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/storage", label: "Storage", icon: HardDrive },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  usedBytes,
  quotaBytes,
  onUpload,
}: {
  usedBytes: number;
  quotaBytes: number;
  onUpload?: () => void;
}) {
  const pathname = usePathname();
  const percent = formatPercent(usedBytes, quotaBytes);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200/80 bg-sidebar px-3 py-4">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HardDrive className="size-4.5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Store It</span>
      </Link>

      <Button className="mb-4 w-full justify-start gap-2" onClick={onUpload}>
        <Upload className="size-4" />
        Upload
      </Button>

      <nav className="flex flex-1 flex-col gap-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Storage</span>
          <span>{percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="mt-2 text-xs text-slate-500">
          {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
        </p>
      </div>
    </aside>
  );
}

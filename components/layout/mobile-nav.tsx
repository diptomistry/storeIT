"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive, LayoutDashboard, Menu, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";

const mobileLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/files", icon: HardDrive, label: "Files" },
  { href: "/starred", icon: Star, label: "Starred" },
  { href: "/trash", icon: Trash2, label: "Trash" },
];

export function MobileNav({
  usedBytes,
  quotaBytes,
  onUpload,
}: {
  usedBytes: number;
  quotaBytes: number;
  onUpload?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <Sidebar usedBytes={usedBytes} quotaBytes={quotaBytes} onUpload={onUpload} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Store It</span>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white lg:hidden">
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${
                active ? "text-primary" : "text-slate-500"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

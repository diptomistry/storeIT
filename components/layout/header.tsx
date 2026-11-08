"use client";

import Link from "next/link";
import { FolderPlus, LogOut, Search, Upload, User } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { BreadcrumbItem } from "@/types";

export function Header({
  breadcrumb,
  email,
  fullName,
  search,
  onSearchChange,
  onUpload,
  onNewFolder,
}: {
  breadcrumb?: BreadcrumbItem[];
  email?: string;
  fullName?: string | null;
  search?: string;
  onSearchChange?: (value: string) => void;
  onUpload?: () => void;
  onNewFolder?: () => void;
}) {
  const initials = (fullName || email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex flex-col gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search files…"
            className="h-10 bg-slate-50 pl-9"
          />
        </div>
        <Button variant="outline" className="hidden sm:inline-flex" onClick={onNewFolder}>
          <FolderPlus className="size-4" />
          New folder
        </Button>
        <Button className="hidden sm:inline-flex" onClick={onUpload}>
          <Upload className="size-4" />
          Upload
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="truncate font-medium">{fullName || "Account"}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">{email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void logoutAction();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {breadcrumb && breadcrumb.length > 0 ? (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          {breadcrumb.map((item, index) => (
            <span key={`${item.id ?? "root"}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span className="text-slate-300">/</span> : null}
              {index === breadcrumb.length - 1 ? (
                <span className="font-medium text-slate-800">{item.name}</span>
              ) : (
                <Link
                  href={item.id ? `/files/${item.id}` : "/files"}
                  className="hover:text-primary"
                >
                  {item.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

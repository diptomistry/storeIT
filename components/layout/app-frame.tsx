"use client";

import { useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { BreadcrumbItem } from "@/types";

export function AppFrame({
  children,
  email,
  fullName,
  usedBytes,
  quotaBytes,
  breadcrumb,
  folderId = null,
  enableSearch = true,
}: {
  children: React.ReactNode | ((search: string) => React.ReactNode);
  email?: string;
  fullName?: string | null;
  usedBytes: number;
  quotaBytes: number;
  breadcrumb?: BreadcrumbItem[];
  folderId?: string | null;
  enableSearch?: boolean;
}) {
  const [search, setSearch] = useState("");

  return (
    <DashboardShell
      email={email}
      fullName={fullName}
      usedBytes={usedBytes}
      quotaBytes={quotaBytes}
      breadcrumb={breadcrumb}
      folderId={folderId}
      search={enableSearch ? search : undefined}
      onSearchChange={enableSearch ? setSearch : undefined}
    >
      {typeof children === "function" ? children(search) : children}
    </DashboardShell>
  );
}

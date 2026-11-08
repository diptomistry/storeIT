"use client";

import { useState } from "react";

import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { UploadDialog } from "@/components/upload/upload-dialog";
import { NewFolderDialog } from "@/components/folders/new-folder-dialog";
import type { BreadcrumbItem } from "@/types";

export function DashboardShell({
  children,
  email,
  fullName,
  usedBytes,
  quotaBytes,
  breadcrumb,
  folderId = null,
  search,
  onSearchChange,
}: {
  children: React.ReactNode;
  email?: string;
  fullName?: string | null;
  usedBytes: number;
  quotaBytes: number;
  breadcrumb?: BreadcrumbItem[];
  folderId?: string | null;
  search?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar
            usedBytes={usedBytes}
            quotaBytes={quotaBytes}
            onUpload={() => setUploadOpen(true)}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <MobileNav
          usedBytes={usedBytes}
          quotaBytes={quotaBytes}
          onUpload={() => setUploadOpen(true)}
        />
        <Header
          breadcrumb={breadcrumb}
          email={email}
          fullName={fullName}
          search={search}
          onSearchChange={onSearchChange}
          onUpload={() => setUploadOpen(true)}
          onNewFolder={() => setFolderOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folderId={folderId} />
      <NewFolderDialog open={folderOpen} onOpenChange={setFolderOpen} parentId={folderId} />
    </div>
  );
}

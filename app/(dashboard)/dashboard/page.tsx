import Link from "next/link";

import { AppFrame } from "@/components/layout/app-frame";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { FileTypeIcon } from "@/components/files/file-icon";
import { EmptyState } from "@/components/files/empty-state";
import { loadDashboardPage } from "@/lib/dashboard-data";
import { formatBytes, formatRelativeDate } from "@/lib/utils/format";

export default async function DashboardPage() {
  const { user, profile, usedBytes, quotaBytes, stats } = await loadDashboardPage();

  return (
    <AppFrame
      email={user.email}
      fullName={profile?.full_name}
      usedBytes={usedBytes}
      quotaBytes={quotaBytes}
      breadcrumb={[{ id: null, name: "Dashboard" }]}
      enableSearch={false}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your Store It workspace.
          </p>
        </div>

        <StatsCards
          totalFiles={stats.totalFiles}
          totalFolders={stats.totalFolders}
          usedBytes={usedBytes}
          quotaBytes={quotaBytes}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent files</h2>
            <Link href="/recent" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {stats.recentFiles.length === 0 ? (
            <EmptyState
              title="No recent files"
              description="Files you upload or modify will show up here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recentFiles.map((file) => (
                <li key={file.id} className="flex items-center gap-3 py-3">
                  <FileTypeIcon mimeType={file.mime_type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(file.size)} · {formatRelativeDate(file.updated_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppFrame>
  );
}

import { AppFrame } from "@/components/layout/app-frame";
import { FilesBrowser } from "@/components/files/files-browser";
import { loadRecentPage } from "@/lib/dashboard-data";

export default async function RecentPage() {
  const data = await loadRecentPage();

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={[{ id: null, name: "Recent" }]}
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recent</h1>
          <p className="mt-1 text-sm text-slate-500">Recently modified files.</p>
        </div>
        <FilesBrowser files={data.files} mode="recent" />
      </div>
    </AppFrame>
  );
}

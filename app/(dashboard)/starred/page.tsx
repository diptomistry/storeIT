import { AppFrame } from "@/components/layout/app-frame";
import { FilesBrowser } from "@/components/files/files-browser";
import { loadStarredPage } from "@/lib/dashboard-data";

export default async function StarredPage() {
  const data = await loadStarredPage();

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={[{ id: null, name: "Starred" }]}
    >
      {(search) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
            <p className="mt-1 text-sm text-slate-500">Files you marked as important.</p>
          </div>
          <FilesBrowser files={data.files} mode="starred" search={search} />
        </div>
      )}
    </AppFrame>
  );
}

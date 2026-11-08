import { AppFrame } from "@/components/layout/app-frame";
import { FilesBrowser } from "@/components/files/files-browser";
import { loadFilesPage } from "@/lib/dashboard-data";

export default async function FilesPage() {
  const data = await loadFilesPage(null);

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={data.breadcrumb}
      folderId={null}
    >
      {(search) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Files</h1>
            <p className="mt-1 text-sm text-slate-500">Browse and manage your stored files.</p>
          </div>
          <FilesBrowser files={data.files} folders={data.folders} search={search} />
        </div>
      )}
    </AppFrame>
  );
}

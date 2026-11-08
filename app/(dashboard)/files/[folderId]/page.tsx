import { AppFrame } from "@/components/layout/app-frame";
import { FilesBrowser } from "@/components/files/files-browser";
import { loadFilesPage } from "@/lib/dashboard-data";

type Params = { params: Promise<{ folderId: string }> };

export default async function FolderPage({ params }: Params) {
  const { folderId } = await params;
  const data = await loadFilesPage(folderId);

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={data.breadcrumb}
      folderId={folderId}
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.breadcrumb.at(-1)?.name ?? "Folder"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Contents of this folder.</p>
        </div>
        <FilesBrowser files={data.files} folders={data.folders} />
      </div>
    </AppFrame>
  );
}

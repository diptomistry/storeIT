import { AppFrame } from "@/components/layout/app-frame";
import { FilesBrowser } from "@/components/files/files-browser";
import { loadTrashPage } from "@/lib/dashboard-data";

export default async function TrashPage() {
  const data = await loadTrashPage();

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={[{ id: null, name: "Trash" }]}
    >
      {(search) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
            <p className="mt-1 text-sm text-slate-500">
              Restore items or permanently delete them to free storage.
            </p>
          </div>
          <FilesBrowser
            files={data.files}
            folders={data.folders}
            mode="trash"
            search={search}
          />
        </div>
      )}
    </AppFrame>
  );
}

import { AppFrame } from "@/components/layout/app-frame";
import { Progress } from "@/components/ui/progress";
import { FileTypeIcon } from "@/components/files/file-icon";
import { loadStoragePage } from "@/lib/dashboard-data";
import { formatBytes, formatPercent, formatRelativeDate } from "@/lib/utils/format";

export default async function StoragePage() {
  const data = await loadStoragePage();
  const percent = formatPercent(data.usedBytes, data.quotaBytes);
  const available = Math.max(0, data.quotaBytes - data.usedBytes);

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={[{ id: null, name: "Storage" }]}
      enableSearch={false}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Storage</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor quota usage and largest files in your account.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Used storage</p>
              <p className="text-3xl font-semibold tracking-tight">
                {formatBytes(data.usedBytes)}
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{percent}% of {formatBytes(data.quotaBytes)}</p>
              <p>{formatBytes(available)} available</p>
            </div>
          </div>
          <Progress value={percent} className="h-3" />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">Breakdown by type</h2>
            {data.breakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.breakdown.map((item) => {
                  const share = formatPercent(item.bytes, data.usedBytes || 1);
                  return (
                    <li key={item.type}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="capitalize">{item.type}</span>
                        <span className="text-slate-500">
                          {formatBytes(item.bytes)} · {share}%
                        </span>
                      </div>
                      <Progress value={share} className="h-1.5" />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">Largest files</h2>
            <ul className="divide-y divide-slate-100">
              {data.largestFiles.map((file) => (
                <li key={file.id} className="flex items-center gap-3 py-2.5">
                  <FileTypeIcon mimeType={file.mime_type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Recently uploaded</h2>
          <ul className="divide-y divide-slate-100">
            {data.recentUploads.map((file) => (
              <li key={file.id} className="flex items-center gap-3 py-2.5">
                <FileTypeIcon mimeType={file.mime_type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(file.size)} · {formatRelativeDate(file.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppFrame>
  );
}

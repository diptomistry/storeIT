import { Files, Folder, HardDrive } from "lucide-react";

import { formatBytes } from "@/lib/utils/format";

export function StatsCards({
  totalFiles,
  totalFolders,
  usedBytes,
  quotaBytes,
}: {
  totalFiles: number;
  totalFolders: number;
  usedBytes: number;
  quotaBytes: number;
}) {
  const cards = [
    {
      label: "Total files",
      value: totalFiles.toLocaleString(),
      icon: Files,
    },
    {
      label: "Total folders",
      value: totalFolders.toLocaleString(),
      icon: Folder,
    },
    {
      label: "Storage used",
      value: formatBytes(usedBytes),
      icon: HardDrive,
      hint: `of ${formatBytes(quotaBytes)}`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-500">{card.label}</p>
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
            {card.hint ? <p className="mt-1 text-xs text-slate-500">{card.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils/format";
import type { FileRecord } from "@/types";

function PreviewBody({ file }: { file: FileRecord }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(`/api/files/${file.id}/preview`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Preview unavailable");
        if (cancelled) return;

        setPreviewUrl(json.data.url);
        setMimeType(json.data.mimeType);

        if (
          json.data.mimeType?.startsWith("text/") ||
          json.data.mimeType === "application/json" ||
          json.data.mimeType === "text/markdown"
        ) {
          const textRes = await fetch(json.data.url);
          const text = await textRes.text();
          if (!cancelled) setTextContent(text.slice(0, 200_000));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Preview unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  if (loading) return <Skeleton className="h-64 w-full" />;

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-600">{error}</p>
        <p className="text-xs text-slate-400">
          {formatBytes(file.size)} · {file.mime_type ?? "unknown type"}
        </p>
      </div>
    );
  }

  if (previewUrl && mimeType?.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={previewUrl}
        alt={file.name}
        className="mx-auto max-h-[60vh] rounded-lg object-contain"
      />
    );
  }

  if (previewUrl && mimeType === "application/pdf") {
    return (
      <iframe title="PDF preview" src={previewUrl} className="h-[60vh] w-full rounded-lg" />
    );
  }

  if (textContent !== null) {
    return (
      <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-xs text-slate-700">
        {textContent}
      </pre>
    );
  }

  return (
    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
      Preview unavailable for this file type.
    </div>
  );
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
  onDownload,
}: {
  file: FileRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file?.name ?? "Preview"}</DialogTitle>
        </DialogHeader>

        <div className="min-h-64 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {open && file ? <PreviewBody key={file.id} file={file} /> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onDownload}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

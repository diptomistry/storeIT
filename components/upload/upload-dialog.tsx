"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type UploadItem = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "completed" | "error" | "cancelled";
  error?: string;
  xhr?: XMLHttpRequest;
  sessionId?: string;
};

export function UploadDialog({
  open,
  onOpenChange,
  folderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      try {
        updateItem(item.id, { status: "uploading", progress: 0 });

        const initRes = await fetch("/api/uploads/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.file.name,
            size: item.file.size,
            mimeType: item.file.type || "application/octet-stream",
            folderId: folderId ?? null,
          }),
        });
        const initJson = await initRes.json();
        if (!initRes.ok) throw new Error(initJson.error || "Failed to start upload");

        const { sessionId, uploadUrl } = initJson.data as {
          sessionId: string;
          uploadUrl: string;
        };
        updateItem(item.id, { sessionId });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          updateItem(item.id, { xhr });
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            updateItem(item.id, {
              progress: Math.round((event.loaded / event.total) * 100),
            });
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error("Upload to storage failed"));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("cancelled"));
          xhr.send(item.file);
        });

        const completeRes = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const completeJson = await completeRes.json();
        if (!completeRes.ok) throw new Error(completeJson.error || "Failed to finalize upload");

        updateItem(item.id, { status: "completed", progress: 100 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        if (message === "cancelled") {
          updateItem(item.id, { status: "cancelled", error: "Cancelled" });
          return;
        }
        updateItem(item.id, { status: "error", error: message });
      }
    },
    [folderId, updateItem]
  );

  const enqueueFiles = useCallback(
    (fileList: FileList | File[]) => {
      const next = Array.from(fileList).map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "queued" as const,
      }));
      setItems((prev) => [...prev, ...next]);
      next.forEach((item) => {
        void uploadOne(item);
      });
    },
    [uploadOne]
  );

  async function cancelItem(item: UploadItem) {
    item.xhr?.abort();
    if (item.sessionId) {
      await fetch("/api/uploads/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: item.sessionId }),
      });
    }
    updateItem(item.id, { status: "cancelled", error: "Cancelled" });
  }

  function close() {
    const hasCompleted = items.some((i) => i.status === "completed");
    onOpenChange(false);
    setItems([]);
    if (hasCompleted) {
      toast.success("Upload complete");
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors",
            dragging && "border-primary bg-primary/5"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) enqueueFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="mb-3 size-8 text-primary" />
          <p className="text-sm font-medium text-slate-800">Drag and drop files here</p>
          <p className="mt-1 text-xs text-slate-500">or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) enqueueFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {items.length > 0 ? (
          <ul className="max-h-56 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(item.file.size)}</p>
                  </div>
                  {item.status === "uploading" || item.status === "queued" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void cancelItem(item)}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <Progress value={item.progress} className="h-1.5" />
                <p className="mt-1 text-xs text-slate-500">
                  {item.status === "error" || item.status === "cancelled"
                    ? item.error
                    : item.status === "completed"
                      ? "Completed"
                      : `${item.progress}%`}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

async function parseJson(res: Response) {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Request failed");
  }
  return json.data;
}

export function useFileActions() {
  const router = useRouter();

  const refresh = () => router.refresh();

  return {
    refresh,
    async download(fileId: string) {
      const data = await parseJson(await fetch(`/api/files/${fileId}/download`));
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    async softDelete(fileId: string) {
      await parseJson(await fetch(`/api/files/${fileId}`, { method: "DELETE" }));
      toast.success("Moved to trash");
      refresh();
    },
    async restore(fileId: string) {
      await parseJson(await fetch(`/api/files/${fileId}/restore`, { method: "POST" }));
      toast.success("File restored");
      refresh();
    },
    async permanentDelete(fileId: string) {
      await parseJson(await fetch(`/api/files/${fileId}/permanent`, { method: "DELETE" }));
      toast.success("File permanently deleted");
      refresh();
    },
    async toggleStar(fileId: string, isStarred: boolean) {
      await parseJson(
        await fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isStarred: !isStarred }),
        })
      );
      toast.success(isStarred ? "Removed from starred" : "Added to starred");
      refresh();
    },
    async rename(fileId: string, name: string) {
      await parseJson(
        await fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
      );
      toast.success("File renamed");
      refresh();
    },
    async softDeleteFolder(folderId: string) {
      await parseJson(await fetch(`/api/folders/${folderId}`, { method: "DELETE" }));
      toast.success("Folder moved to trash");
      refresh();
    },
    async restoreFolder(folderId: string) {
      await parseJson(await fetch(`/api/folders/${folderId}/restore`, { method: "POST" }));
      toast.success("Folder restored");
      refresh();
    },
    async renameFolder(folderId: string, name: string) {
      await parseJson(
        await fetch(`/api/folders/${folderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
      );
      toast.success("Folder renamed");
      refresh();
    },
  };
}

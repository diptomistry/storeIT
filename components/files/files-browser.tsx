"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { FileTypeIcon } from "@/components/files/file-icon";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { EmptyState } from "@/components/files/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSearchQuery } from "@/components/layout/search-context";
import { useFileActions } from "@/hooks/use-file-actions";
import { formatBytes, formatRelativeDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { FileRecord, Folder, SortField, SortOrder, ViewMode } from "@/types";

export function FilesBrowser({
  files,
  folders,
  mode = "files",
}: {
  files: FileRecord[];
  folders?: Folder[];
  mode?: "files" | "recent" | "starred" | "trash";
}) {
  const search = useSearchQuery();
  const actions = useFileActions();
  const [view, setView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [confirmPermanent, setConfirmPermanent] = useState<FileRecord | null>(null);

  const filteredFolders = useMemo(() => {
    const list = folders ?? [];
    if (!search.trim()) return list;
    return list.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [folders, search]);

  const filteredFiles = useMemo(() => {
    let list = [...files];
    if (search.trim()) {
      list = list.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
    }
    list.sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "size") return (a.size - b.size) * dir;
      if (sortBy === "mime_type") {
        return (a.mime_type ?? "").localeCompare(b.mime_type ?? "") * dir;
      }
      return a.updated_at.localeCompare(b.updated_at) * dir;
    });
    return list;
  }, [files, search, sortBy, sortOrder]);

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  async function safe(run: () => Promise<void>) {
    try {
      await run();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="updated_at">Date modified</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="mime_type">Type</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          title={mode === "trash" ? "Trash is empty" : "No files yet"}
          description={
            mode === "trash"
              ? "Deleted files and folders will appear here."
              : mode === "starred"
                ? "Star files to find them quickly later."
                : "Upload files or create a folder to get started."
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              {mode === "trash" ? (
                <div className="flex flex-col items-start gap-3">
                  <FileTypeIcon isFolder className="size-8" />
                  <div className="w-full truncate text-sm font-medium">{folder.name}</div>
                </div>
              ) : (
                <Link href={`/files/${folder.id}`} className="flex flex-col items-start gap-3">
                  <FileTypeIcon isFolder className="size-8" />
                  <div className="w-full truncate text-sm font-medium">{folder.name}</div>
                </Link>
              )}
              <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
                <ItemMenu
                  mode={mode}
                  isFolder
                  onRename={() => {
                    const name = window.prompt("Rename folder", folder.name);
                    if (name) void safe(() => actions.renameFolder(folder.id, name));
                  }}
                  onRestore={() => void safe(() => actions.restoreFolder(folder.id))}
                  onSoftDelete={() => void safe(() => actions.softDeleteFolder(folder.id))}
                />
              </div>
            </div>
          ))}
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              <button
                type="button"
                className="flex w-full flex-col items-start gap-3 text-left"
                onClick={() => mode !== "trash" && setPreviewFile(file)}
              >
                <FileTypeIcon mimeType={file.mime_type} className="size-8" />
                <div className="w-full">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{formatBytes(file.size)}</div>
                </div>
              </button>
              <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
                <FileMenu
                  file={file}
                  mode={mode}
                  onPreview={() => setPreviewFile(file)}
                  onDownload={() => void safe(() => actions.download(file.id))}
                  onStar={() => void safe(() => actions.toggleStar(file.id, file.is_starred))}
                  onRename={() => {
                    const name = window.prompt("Rename file", file.name);
                    if (name) void safe(() => actions.rename(file.id, name));
                  }}
                  onSoftDelete={() => void safe(() => actions.softDelete(file.id))}
                  onRestore={() => void safe(() => actions.restore(file.id))}
                  onPermanent={() => setConfirmPermanent(file)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Modified</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFolders.map((folder) => (
                <TableRow key={folder.id}>
                  <TableCell>
                    {mode === "trash" ? (
                      <div className="flex items-center gap-2.5">
                        <FileTypeIcon isFolder />
                        <span className="font-medium">{folder.name}</span>
                      </div>
                    ) : (
                      <Link
                        href={`/files/${folder.id}`}
                        className="flex items-center gap-2.5 font-medium hover:text-primary"
                      >
                        <FileTypeIcon isFolder />
                        {folder.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-slate-500 md:table-cell">
                    {formatRelativeDate(folder.updated_at)}
                  </TableCell>
                  <TableCell className="hidden text-slate-500 sm:table-cell">—</TableCell>
                  <TableCell>
                    <ItemMenu
                      mode={mode}
                      isFolder
                      onRename={() => {
                        const name = window.prompt("Rename folder", folder.name);
                        if (name) void safe(() => actions.renameFolder(folder.id, name));
                      }}
                      onRestore={() => void safe(() => actions.restoreFolder(folder.id))}
                      onSoftDelete={() => void safe(() => actions.softDeleteFolder(folder.id))}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-2.5 text-left font-medium hover:text-primary"
                      onClick={() => mode !== "trash" && setPreviewFile(file)}
                    >
                      <FileTypeIcon mimeType={file.mime_type} />
                      <span className="truncate">{file.name}</span>
                      {file.is_starred ? (
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      ) : null}
                    </button>
                  </TableCell>
                  <TableCell className="hidden text-slate-500 md:table-cell">
                    {formatRelativeDate(file.updated_at)}
                  </TableCell>
                  <TableCell className="hidden text-slate-500 sm:table-cell">
                    {formatBytes(file.size)}
                  </TableCell>
                  <TableCell>
                    <FileMenu
                      file={file}
                      mode={mode}
                      onPreview={() => setPreviewFile(file)}
                      onDownload={() => void safe(() => actions.download(file.id))}
                      onStar={() => void safe(() => actions.toggleStar(file.id, file.is_starred))}
                      onRename={() => {
                        const name = window.prompt("Rename file", file.name);
                        if (name) void safe(() => actions.rename(file.id, name));
                      }}
                      onSoftDelete={() => void safe(() => actions.softDelete(file.id))}
                      onRestore={() => void safe(() => actions.restore(file.id))}
                      onPermanent={() => setConfirmPermanent(file)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onDownload={() => {
          if (previewFile) void safe(() => actions.download(previewFile.id));
        }}
      />

      <AlertDialog
        open={!!confirmPermanent}
        onOpenChange={(open) => !open && setConfirmPermanent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {confirmPermanent?.name} from storage and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (confirmPermanent) {
                  void safe(() => actions.permanentDelete(confirmPermanent.id));
                }
              }}
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemMenu({
  mode,
  isFolder,
  onRename,
  onSoftDelete,
  onRestore,
}: {
  mode: "files" | "recent" | "starred" | "trash";
  isFolder?: boolean;
  onRename: () => void;
  onSoftDelete: () => void;
  onRestore: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {mode === "trash" ? (
          <DropdownMenuItem onClick={onRestore}>
            <RotateCcw className="size-4" />
            Restore
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSoftDelete}>
              <Trash2 className="size-4" />
              {isFolder ? "Delete folder" : "Move to trash"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FileMenu({
  file,
  mode,
  onPreview,
  onDownload,
  onStar,
  onRename,
  onSoftDelete,
  onRestore,
  onPermanent,
}: {
  file: FileRecord;
  mode: "files" | "recent" | "starred" | "trash";
  onPreview: () => void;
  onDownload: () => void;
  onStar: () => void;
  onRename: () => void;
  onSoftDelete: () => void;
  onRestore: () => void;
  onPermanent: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className={cn(file.is_starred && "text-amber-500")}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {mode === "trash" ? (
          <>
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="size-4" />
              Restore
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPermanent}>
              <Trash2 className="size-4" />
              Delete forever
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="size-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="size-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onStar}>
              <Star className="size-4" />
              {file.is_starred ? "Unstar" : "Star"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSoftDelete}>
              <Trash2 className="size-4" />
              Move to trash
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

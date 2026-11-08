import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
} from "lucide-react";

export function FileTypeIcon({
  mimeType,
  isFolder,
  className = "size-5",
}: {
  mimeType?: string | null;
  isFolder?: boolean;
  className?: string;
}) {
  if (isFolder) {
    return <Folder className={`${className} text-amber-500`} />;
  }

  const mime = mimeType ?? "";
  if (mime.startsWith("image/")) return <FileImage className={`${className} text-emerald-500`} />;
  if (mime.startsWith("video/")) return <FileVideo className={`${className} text-violet-500`} />;
  if (mime.startsWith("audio/")) return <FileAudio className={`${className} text-pink-500`} />;
  if (mime.includes("zip") || mime.includes("gzip") || mime.includes("tar")) {
    return <FileArchive className={`${className} text-orange-500`} />;
  }
  if (
    mime.includes("javascript") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("css")
  ) {
    return <FileCode className={`${className} text-sky-500`} />;
  }
  if (mime.startsWith("text/") || mime.includes("pdf") || mime.includes("document")) {
    return <FileText className={`${className} text-blue-500`} />;
  }
  return <File className={`${className} text-slate-400`} />;
}

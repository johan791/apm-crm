"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Folder,
  ExternalLink,
  Loader2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

interface SharePointFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  lastModifiedDateTime: string;
  isFolder: boolean;
}

function getFileIcon(name: string, isFolder: boolean) {
  if (isFolder) return <Folder className="h-4 w-4 text-amber-500" />;
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "svg"].includes(ext || ""))
    return <Image className="h-4 w-4 text-purple-500" />;
  if (["xlsx", "xls", "csv"].includes(ext || ""))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (["pdf", "doc", "docx", "pptx", "ppt"].includes(ext || ""))
    return <FileText className="h-4 w-4 text-blue-600" />;
  return <File className="h-4 w-4 text-gray-400" />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE");
}

export function SharePointFiles({
  folderName,
  sharePointUrl,
}: {
  folderName: string;
  sharePointUrl?: string;
}) {
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch(
          `/api/sharepoint/files?folder=${encodeURIComponent(folderName)}`
        );
        if (!res.ok) throw new Error("Kunde inte hämta filer");
        const data = await res.json();
        setFiles(data.files || []);
      } catch {
        setError("Kunde inte hämta filer från SharePoint");
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [folderName]);

  const folders = files.filter((f) => f.isFolder);
  const documents = files.filter((f) => !f.isFolder);

  return (
    <div className="space-y-3">
      {sharePointUrl && (
        <a
          href={sharePointUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Öppna mapp i SharePoint</span>
          <ExternalLink className="h-3 w-3 ml-auto" />
        </a>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-500 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Hämtar filer från SharePoint...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">
          Inga filer i mappen
        </p>
      )}

      {!loading && !error && folders.length > 0 && (
        <div className="space-y-1">
          {folders.map((folder) => (
            <a
              key={folder.id}
              href={folder.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors group"
            >
              {getFileIcon(folder.name, true)}
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate flex-1">
                {folder.name}
              </span>
              <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-blue-500" />
            </a>
          ))}
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="space-y-1">
          {folders.length > 0 && (
            <div className="border-t border-gray-100 my-2" />
          )}
          {documents.map((file) => (
            <a
              key={file.id}
              href={file.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors group"
            >
              {getFileIcon(file.name, false)}
              <span className="text-sm text-gray-900 group-hover:text-blue-700 truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {formatSize(file.size)}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(file.lastModifiedDateTime)}
              </span>
              <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-blue-500" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

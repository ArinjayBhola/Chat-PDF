// UI REDESIGN
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const NativePDFViewer = dynamic(() => import("./NativePDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-20 gap-4 h-full w-full bg-background/50 animate-pulse">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 mb-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs font-bold text-primary tracking-widest uppercase">Loading PDF Viewer...</p>
    </div>
  ),
});

type FileCategory = "pdf" | "document" | "spreadsheet" | "presentation" | "text" | "image";

const EXTENSION_CATEGORY: Record<string, FileCategory> = {
  ".pdf": "pdf",
  ".docx": "document",
  ".doc": "document",
  ".xlsx": "spreadsheet",
  ".xls": "spreadsheet",
  ".csv": "text",
  ".pptx": "presentation",
  ".ppt": "presentation",
  ".txt": "text",
  ".md": "text",
  ".json": "text",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".gif": "image",
  ".webp": "image",
};

function getCategory(fileName: string, fileUrl?: string): FileCategory {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const category = EXTENSION_CATEGORY[ext];
  if (category) return category;

  // Fallback: detect from URL (handles renamed files that lost their extension)
  if (fileUrl) {
    try {
      const urlPath = new URL(fileUrl).pathname;
      const urlExt = urlPath.slice(urlPath.lastIndexOf(".")).toLowerCase();
      const urlCategory = EXTENSION_CATEGORY[urlExt];
      if (urlCategory) return urlCategory;
    } catch {}
  }

  return "text";
}

type Props = {
  file_url: string;
  file_name: string;
  file_key?: string;
  refreshKey?: number;
};

const FileViewer = ({ file_url, file_name, file_key, refreshKey = 0 }: Props) => {
  const validUrl = file_url.replace("https// ", "https://");
  const category = getCategory(file_name, validUrl);

  if (category === "image") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card/50 overflow-auto p-4 border-l border-border backdrop-blur-sm">
        <img
          key={refreshKey}
          src={validUrl}
          alt={file_name}
          className="max-w-full max-h-full object-contain rounded-xl shadow-lg ring-1 ring-border"
        />
      </div>
    );
  }

  if (category === "text") {
    return (
      <div className="w-full h-full border-l border-border bg-background">
        <TextFileViewer key={refreshKey} url={validUrl} fileName={file_name} />
      </div>
    );
  }

  if (category === "pdf") {
    // Use proxy for PDFs to avoid CORS issues with S3
    const proxyUrl = `/api/pdf-proxy?key=${encodeURIComponent(file_key || "")}`;
    return <NativePDFViewer key={refreshKey} url={proxyUrl} />;
  }

  // Other documents (DOCX, XLSX, PPTX) — use Google Docs Viewer fallback
  return (
    <iframe
      key={refreshKey}
      src={`https://docs.google.com/gview?url=${validUrl}&embedded=true`}
      className="w-full h-full"
    />
  );
};

function TextFileViewer({ url, fileName }: { url: string; fileName: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.text();
      })
      .then(setContent)
      .catch(() => setError(true));
  }, [url]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-3 p-4">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-xs">
          <span className="text-destructive text-md font-bold">!</span>
        </div>
        <p className="font-semibold text-xs text-foreground">Could not load preview</p>
        <button
          onClick={() => { setError(false); setContent(null); }}
          className="text-xs text-primary hover:text-primary/80 font-bold transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="w-full h-full flex flex-col justify-center text-muted-foreground bg-muted/30 p-6">
        <div className="w-full space-y-4 animate-pulse">
          <div className="h-4 bg-muted-foreground/15 rounded w-1/4" />
          <div className="h-2.5 bg-muted-foreground/10 rounded w-full" />
          <div className="h-2.5 bg-muted-foreground/10 rounded w-full" />
          <div className="h-2.5 bg-muted-foreground/10 rounded w-5/6" />
          <div className="h-2.5 bg-muted-foreground/10 rounded w-4/5" />
          <div className="h-2.5 bg-muted-foreground/10 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-card p-6 border-l border-border custom-scrollbar">
      <div className="text-xs font-bold text-primary mb-4 uppercase tracking-widest border-b border-border/50 pb-2">
        {fileName}
      </div>
      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-background p-4 rounded-lg border border-border shadow-xs">
        {content}
      </pre>
    </div>
  );
}

export default FileViewer;

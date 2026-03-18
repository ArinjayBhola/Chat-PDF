"use client";

import React, { useEffect, useState } from "react";

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
  refreshKey?: number;
};

const FileViewer = ({ file_url, file_name, refreshKey = 0 }: Props) => {
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

  // PDF, DOCX, XLSX, PPTX — use Google Docs Viewer
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
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-3">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-lg font-bold">!</span>
        </div>
        <p className="font-medium text-sm">Could not load file preview</p>
        <button
          onClick={() => { setError(false); setContent(null); }}
          className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-medium text-sm">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-card p-6 border-l border-border custom-scrollbar">
      <div className="text-xs font-bold text-primary mb-4 uppercase tracking-widest border-b border-border/50 pb-2">
        {fileName}
      </div>
      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-background p-4 rounded-xl border border-border shadow-inner">
        {content}
      </pre>
    </div>
  );
}

export default FileViewer;

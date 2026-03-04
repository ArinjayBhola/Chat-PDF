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

function getCategory(fileName: string): FileCategory {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return EXTENSION_CATEGORY[ext] || "text";
}

type Props = {
  file_url: string;
  file_name: string;
};

const FileViewer = ({ file_url, file_name }: Props) => {
  const validUrl = file_url.replace("https// ", "https://");
  const category = getCategory(file_name);

  if (category === "image") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card/50 overflow-auto p-4 border-l border-border backdrop-blur-sm">
        <img
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
        <TextFileViewer url={validUrl} fileName={file_name} />
      </div>
    );
  }

  // PDF, DOCX, XLSX, PPTX — use Google Docs Viewer
  return (
    <iframe
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
      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-card/50 backdrop-blur-sm">
        <p className="font-medium animate-pulse">Could not load file preview.</p>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-card/50 backdrop-blur-sm">
        <p className="font-medium animate-pulse">Loading...</p>
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

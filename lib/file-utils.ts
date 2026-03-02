import path from "path";

export type FileCategory = "pdf" | "document" | "spreadsheet" | "presentation" | "text" | "image";

const EXTENSION_MAP: Record<string, FileCategory> = {
  ".pdf": "pdf",
  ".docx": "document",
  ".doc": "document",
  ".xlsx": "spreadsheet",
  ".xls": "spreadsheet",
  ".csv": "spreadsheet",
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

export function getFileCategory(fileName: string): FileCategory {
  const ext = path.extname(fileName).toLowerCase();
  return EXTENSION_MAP[ext] || "text";
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function getAcceptedMimeTypes(): Record<string, string[]> {
  return {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    "text/plain": [".txt"],
    "text/markdown": [".md"],
    "text/csv": [".csv"],
    "application/json": [".json"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
  };
}

export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_MAP);
}

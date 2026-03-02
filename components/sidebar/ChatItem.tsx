import React, { memo } from "react";
import Link from "next/link";
import { FiFileText, FiImage, FiTrash } from "react-icons/fi";
import { LuFileSpreadsheet, LuPresentation, LuFileText } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";

type FileCategory = "pdf" | "document" | "spreadsheet" | "presentation" | "text" | "image";

const EXT_MAP: Record<string, FileCategory> = {
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

function getCategory(name: string): FileCategory {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return EXT_MAP[ext] || "text";
}

function FileIcon({ name, className }: { name: string; className?: string }) {
  const cat = getCategory(name);
  switch (cat) {
    case "image":
      return <FiImage className={cn("text-purple-400", className)} />;
    case "spreadsheet":
      return <LuFileSpreadsheet className={cn("text-green-400", className)} />;
    case "presentation":
      return <LuPresentation className={cn("text-orange-400", className)} />;
    case "document":
      return <LuFileText className={cn("text-blue-400", className)} />;
    case "pdf":
      return <FiFileText className={cn("text-red-400", className)} />;
    default:
      return <FiFileText className={cn("text-slate-400", className)} />;
  }
}

export const ChatItem = memo(
  ({
    chat,
    isActive,
    onDelete,
  }: {
    chat: DrizzleChat;
    isActive: boolean;
    onDelete: (e: React.MouseEvent, chatId: string, chatName: string) => void;
  }) => (
    <div className="relative group">
      <Link
        href={`/chat/${chat.id}`}
        className="block">
        <div
          className={cn("rounded-lg p-3 flex items-center transition-all duration-200 overflow-hidden", {
            "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700": isActive,
            "text-slate-400 hover:text-white hover:bg-slate-800/50": !isActive,
          })}>
          <FileIcon name={chat.pdfName} className="mr-3 w-4 h-4 flex-shrink-0" />
          <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap font-medium tracking-wide pr-6">
            {chat.pdfName}
          </p>

          {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l" />}
        </div>
      </Link>

      {/* Delete Button - visible on hover or if active */}
      <div
        onClick={(e) => onDelete(e, chat.id, chat.pdfName)}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 z-20 cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400",
          { "opacity-100": isActive },
        )}>
        <FiTrash size={14} />
      </div>
    </div>
  ),
);
ChatItem.displayName = "ChatItem";

export const CollapsedChatItem = memo(({ chat, isActive }: { chat: DrizzleChat; isActive: boolean }) => (
  <Link
    key={chat.id}
    href={`/chat/${chat.id}`}>
    <div
      className={cn(
        "p-3 rounded-lg transition-colors",
        isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
      )}>
      <FileIcon name={chat.pdfName} className="w-4 h-4" />
    </div>
  </Link>
));
CollapsedChatItem.displayName = "CollapsedChatItem";

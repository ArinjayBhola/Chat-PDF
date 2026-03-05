import React, { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiFileText, FiImage, FiTrash, FiEdit2 } from "react-icons/fi";
import { LuFileSpreadsheet, LuPresentation, LuFileText } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";
import axios from "axios";
import { toast } from "react-hot-toast";

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
  }) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(chat.fileName);
    const [isRenaming, setIsRenaming] = React.useState(false);

    const handleRename = async () => {
      if (editName === chat.fileName || !editName.trim()) {
        setIsEditing(false);
        setEditName(chat.fileName);
        return;
      }

      try {
        setIsRenaming(true);
        await axios.post("/api/rename-chat", {
          chatId: chat.id,
          newName: editName,
        });
        toast.success("Chat renamed!");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to rename chat");
        setEditName(chat.fileName);
      } finally {
        setIsRenaming(false);
        setIsEditing(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRename();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditName(chat.fileName);
      }
    };

    return (
      <div className="relative group">
        <Link
          href={isEditing ? "#" : `/chat/${chat.id}`}
          onClick={(e) => isEditing && e.preventDefault()}
          className="block">
          <div
            className={cn("rounded-lg p-3 flex items-center transition-all duration-200", {
              "bg-primary/10 text-primary shadow-sm font-semibold": isActive,
              "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium": !isActive,
            })}>
            <FileIcon name={chat.fileName} className="mr-3 w-4 h-4 flex-shrink-0" />
            {isEditing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                disabled={isRenaming}
                className="w-full bg-transparent text-sm outline-none border-b border-primary/50 pb-0.5 focus:border-primary transition-colors pr-6"
              />
            ) : (
              <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap tracking-wide pr-14">
                {chat.fileName}
              </p>
            )}

            {isActive && <div className="absolute right-0 top-1 bottom-1 w-1 bg-primary rounded-l-full" />}
          </div>
        </Link>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {!isEditing && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title="Rename chat"
            >
              <FiEdit2 size={14} />
            </div>
          )}
          <div
            onClick={(e) => onDelete(e, chat.id, chat.fileName)}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200 cursor-pointer hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
              { "opacity-100": isActive },
            )}
            title="Delete chat"
          >
            <FiTrash size={14} />
          </div>
        </div>
      </div>
    );
  },
);
ChatItem.displayName = "ChatItem";

export const CollapsedChatItem = memo(({ chat, isActive }: { chat: DrizzleChat; isActive: boolean }) => (
  <Link
    key={chat.id}
    href={`/chat/${chat.id}`}
    className="relative block"
  >
    <div
      className={cn(
        "p-3 rounded-lg transition-colors flex items-center justify-center",
        isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}>
      <FileIcon name={chat.fileName} className="w-5 h-5" />
    </div>
    {isActive && <div className="absolute right-[-4px] top-1 bottom-1 w-1 bg-primary rounded-l-full" />}
  </Link>
));
CollapsedChatItem.displayName = "CollapsedChatItem";

// UI REDESIGN
import React, { memo } from "react";
import Link from "next/link";
import { FiFileText, FiImage, FiTrash, FiEdit2 } from "react-icons/fi";
import { LuFileSpreadsheet, LuPresentation, LuFileText, LuPin, LuPinOff } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

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
      return <FiFileText className={cn("text-muted-foreground", className)} />;
  }
}

export const ChatItem = memo(
  ({
    chat,
    isActive,
    onDelete,
    onTogglePin,
  }: {
    chat: DrizzleChat;
    isActive: boolean;
    onDelete: (e: React.MouseEvent, chatId: string, chatName: string) => void;
    onTogglePin?: (chatId: string, isPinned: boolean) => void;
  }) => {
    const queryClient = useQueryClient();
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
        queryClient.invalidateQueries({ queryKey: ["chats-list"] });
        queryClient.invalidateQueries({ queryKey: ["comparisons-list"] });
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
      <div
        className="relative group"
        draggable={!isEditing}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", chat.id);
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <Link
          href={isEditing ? "#" : `/chat/${chat.id}`}
          onClick={(e) => isEditing && e.preventDefault()}
          className="block">
          <div
            className={cn("rounded-md p-2 flex items-center transition-none", {
              "bg-black/10 dark:bg-white/10 text-foreground font-semibold shadow-sm": isActive,
              "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground font-medium": !isActive,
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

          </div>
        </Link>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {!isEditing && onTogglePin && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin(chat.id, chat.isPinned !== "true");
              }}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title={chat.isPinned === "true" ? "Unpin chat" : "Pin chat"}
            >
              {chat.isPinned === "true" ? <LuPinOff size={14} /> : <LuPin size={14} />}
            </div>
          )}
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
        "p-2 rounded-md transition-colors flex items-center justify-center",
        isActive ? "bg-black/10 dark:bg-white/10 text-foreground shadow-sm" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground",
      )}>
      <FileIcon name={chat.fileName} className="w-5 h-5" />
    </div>
  </Link>
));
CollapsedChatItem.displayName = "CollapsedChatItem";

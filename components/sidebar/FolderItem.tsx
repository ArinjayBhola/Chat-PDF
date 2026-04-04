import React, { memo, useState } from "react";
import { LuChevronDown, LuFolder, LuFolderOpen, LuTrash2, LuPencil } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { DrizzleChat, DrizzleFolder } from "@/lib/db/schema";
import { ChatItem } from "./ChatItem";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { RiLoader2Fill } from "react-icons/ri";

type Props = {
  folder: DrizzleFolder;
  chats: DrizzleChat[];
  chatId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDeleteChat: (e: React.MouseEvent, chatId: string, chatName: string) => void;
  onMoveChat: (chatId: string, folderId: string | null) => void;
};

const FolderItem = memo(({
  folder,
  chats,
  chatId,
  isExpanded,
  onToggleExpand,
  onDeleteChat,
  onMoveChat,
}: Props) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedChatId = e.dataTransfer.getData("text/plain");
    if (droppedChatId) {
      onMoveChat(droppedChatId, folder.id);
    }
  };

  const handleRename = async () => {
    if (editName === folder.name || !editName.trim()) {
      setIsEditing(false);
      setEditName(folder.name);
      return;
    }
    try {
      setIsRenaming(true);
      await axios.patch(`/api/folders/${folder.id}`, { name: editName.trim() });
      toast.success("Folder renamed!");
      queryClient.invalidateQueries({ queryKey: ["folders-list"] });
    } catch {
      toast.error("Failed to rename folder");
      setEditName(folder.name);
    } finally {
      setIsRenaming(false);
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await axios.delete(`/api/folders/${folder.id}`);
      toast.success("Folder deleted");
      queryClient.invalidateQueries({ queryKey: ["folders-list"] });
      queryClient.invalidateQueries({ queryKey: ["chats-list"] });
    } catch {
      toast.error("Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(folder.name);
    }
  };

  return (
    <div className="mb-1">
      {/* Folder Header */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200",
          "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
          isDragOver && "ring-2 ring-primary/50 bg-primary/5"
        )}
        onClick={() => !isEditing && onToggleExpand()}
      >
        <LuChevronDown
          className={cn(
            "w-3 h-3 flex-shrink-0 transition-transform duration-200",
            !isExpanded && "-rotate-90"
          )}
        />
        {isExpanded ? (
          <LuFolderOpen className="w-4 h-4 flex-shrink-0 text-primary/70" />
        ) : (
          <LuFolder className="w-4 h-4 flex-shrink-0 text-primary/70" />
        )}

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            disabled={isRenaming}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent text-xs font-medium outline-none border-b border-primary/50 pb-0.5 focus:border-primary transition-colors"
          />
        ) : (
          <span className="flex-1 min-w-0 text-xs font-medium truncate">
            {folder.name}
          </span>
        )}

        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
          {chats.length}
        </span>

        {/* Folder actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Rename folder"
            >
              <LuPencil className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete folder"
          >
            {isDeleting ? (
              <RiLoader2Fill className="w-3 h-3 animate-spin" />
            ) : (
              <LuTrash2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Folder Contents */}
      {isExpanded && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5">
          {chats.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/50 italic px-2 py-1">
              No chats in this folder
            </p>
          ) : (
            chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === chatId}
                onDelete={onDeleteChat}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

FolderItem.displayName = "FolderItem";
export default FolderItem;

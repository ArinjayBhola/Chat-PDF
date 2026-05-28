// UI REDESIGN
import React, { memo, useMemo, useState, useCallback, useEffect } from "react";
import { DrizzleChat, DrizzleFolder } from "@/lib/db/schema";
import FolderItem from "./FolderItem";
import { ChatItem } from "./ChatItem";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { LuPin } from "react-icons/lu";

type Props = {
  folders: DrizzleFolder[];
  chats: DrizzleChat[];
  chatId: string;
  searchQuery: string;
  onDeleteChat: (e: React.MouseEvent, chatId: string, chatName: string) => void;
  onTogglePin: (chatId: string, isPinned: boolean) => void;
};

const STORAGE_KEY = "chat-pdf-expanded-folders";

function loadExpandedFolders(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveExpandedFolders(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

const FolderList = memo(({ folders, chats, chatId, searchQuery, onDeleteChat, onTogglePin }: Props) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(loadExpandedFolders);
  const [uncategorizedDragOver, setUncategorizedDragOver] = useState(false);
  const queryClient = useQueryClient();

  const isSearching = searchQuery.trim().length > 0;

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!isSearching) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((chat) => chat.fileName.toLowerCase().includes(q));
  }, [chats, searchQuery, isSearching]);

  // Split into pinned and unpinned, then group unpinned by folderId
  const { pinnedChats, folderChatsMap, uncategorizedChats } = useMemo(() => {
    const pinned: DrizzleChat[] = [];
    const map = new Map<string, DrizzleChat[]>();
    const uncategorized: DrizzleChat[] = [];

    for (const chat of filteredChats) {
      if (chat.isPinned === "true") {
        pinned.push(chat);
      } else if (chat.folderId) {
        const existing = map.get(chat.folderId) || [];
        existing.push(chat);
        map.set(chat.folderId, existing);
      } else {
        uncategorized.push(chat);
      }
    }

    return { pinnedChats: pinned, folderChatsMap: map, uncategorizedChats: uncategorized };
  }, [filteredChats]);

  // When searching, auto-expand folders with matching chats
  const effectiveExpanded = useMemo(() => {
    if (!isSearching) return expandedFolders;
    const set = new Set<string>();
    for (const folder of folders) {
      if (folderChatsMap.has(folder.id)) {
        set.add(folder.id);
      }
    }
    return set;
  }, [isSearching, expandedFolders, folders, folderChatsMap]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      saveExpandedFolders(next);
      return next;
    });
  }, []);

  // Optimistic move with rollback
  const handleMoveChat = useCallback(async (moveChatId: string, folderId: string | null) => {
    const previousChats = queryClient.getQueryData<DrizzleChat[]>(["chats-list"]);

    // Optimistic update
    queryClient.setQueryData<DrizzleChat[]>(["chats-list"], (old) =>
      old?.map((c) => (c.id === moveChatId ? { ...c, folderId } : c))
    );

    try {
      await axios.patch("/api/chats/move", { chatId: moveChatId, folderId });
    } catch {
      queryClient.setQueryData(["chats-list"], previousChats);
      toast.error("Failed to move chat");
    }
  }, [queryClient]);

  // Filter out folders with no matching chats when searching
  const visibleFolders = useMemo(() => {
    if (!isSearching) return folders;
    return folders.filter((f) => folderChatsMap.has(f.id));
  }, [isSearching, folders, folderChatsMap]);

  // Auto-expand folder when a chat inside it becomes active
  useEffect(() => {
    const activeChat = chats.find((c) => c.id === chatId);
    if (activeChat?.folderId && !expandedFolders.has(activeChat.folderId)) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(activeChat.folderId!);
        saveExpandedFolders(next);
        return next;
      });
    }
  }, [chatId, chats]);

  if (filteredChats.length === 0 && isSearching) {
    return (
      <p className="text-xs text-muted-foreground/60 italic px-2 py-4 text-center">
        No chats found for &quot;{searchQuery}&quot;
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Pinned Chats */}
      {pinnedChats.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 px-2 mb-1">
            <LuPin className="w-3 h-3 text-primary/70" />
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
              Pinned
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            {pinnedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === chatId}
                onDelete={onDeleteChat}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Folders */}
      {visibleFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          chats={folderChatsMap.get(folder.id) || []}
          chatId={chatId}
          isExpanded={effectiveExpanded.has(folder.id)}
          onToggleExpand={() => toggleFolder(folder.id)}
          onDeleteChat={onDeleteChat}
          onMoveChat={handleMoveChat}
          onTogglePin={onTogglePin}
        />
      ))}

      {/* Uncategorized Chats */}
      {uncategorizedChats.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setUncategorizedDragOver(true);
          }}
          onDragLeave={() => setUncategorizedDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setUncategorizedDragOver(false);
            const droppedChatId = e.dataTransfer.getData("text/plain");
            if (droppedChatId) handleMoveChat(droppedChatId, null);
          }}
          className={cn(
            "mt-1 rounded-md transition-all duration-200",
            uncategorizedDragOver && "ring-2 ring-primary/50 bg-primary/5"
          )}
        >
          {(visibleFolders.length > 0 || pinnedChats.length > 0) && (
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2 mb-1 mt-2">
              Uncategorized
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {uncategorizedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === chatId}
                onDelete={onDeleteChat}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no chats at all */}
      {filteredChats.length === 0 && !isSearching && (
        <div className="px-2 text-muted-foreground text-sm italic">No chats yet.</div>
      )}
    </div>
  );
});

FolderList.displayName = "FolderList";
export default FolderList;

// UI REDESIGN
"use client";

import { DrizzleChat } from "@/lib/db/schema";
import React, { useState, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import DeleteChatModal from "./DeleteChatModal";
import axios from "axios";
import toast from "react-hot-toast";
import ExpandedSidebar from "./sidebar/ExpandedSidebar";
import CollapsedSidebar from "./sidebar/CollapsedSidebar";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showUndoToast } from "./UndoToast";

type Props = {
  chats: DrizzleChat[];
  chatId?: string;
  className?: string;
  isPro: boolean;
};

// Main ChatSidebar Component
const ChatSidebar = ({ chats: initialChats, chatId: propChatId, className, isPro }: Props) => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  // Use React Query for chats with server data as initial
  const { data: chats = initialChats } = useQuery<DrizzleChat[]>({
    queryKey: ["chats-list"],
    queryFn: async () => {
      const res = await axios.get("/api/chats");
      return res.data;
    },
    initialData: initialChats,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Memoize chatId to prevent unnecessary recalculations
  const chatId = useMemo(() => propChatId || (params?.chatId as string), [propChatId, params?.chatId]);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const confirmDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
    setDeleteName(name);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const deletingChatId = deleteId;
    const deletingChatName = deleteName;

    // Snapshot current cache for rollback
    const previousChats = queryClient.getQueryData<DrizzleChat[]>(["chats-list"]);

    // Optimistically remove chat from cache
    queryClient.setQueryData<DrizzleChat[]>(["chats-list"], (old) =>
      old?.filter((c) => c.id !== deletingChatId)
    );

    // Close the modal and reset local state immediately
    setDeleteId(null);
    setDeleteName("");

    // Show undo toast with grace period
    showUndoToast({
      message: `"${deletingChatName}" deleted`,
      duration: 5000,
      onUndo: () => {
        // Restore chat in cache
        queryClient.setQueryData(["chats-list"], previousChats);
        toast.success("Chat restored!");
      },
      onConfirm: async () => {
        // Actually delete after grace period
        try {
          await axios.delete("/api/delete-chat", {
            data: { chatId: deletingChatId },
          });
          queryClient.invalidateQueries({ queryKey: ["chats-list"] });
          queryClient.invalidateQueries({ queryKey: ["comparisons-list"] });
          queryClient.invalidateQueries({ queryKey: ["folders-list"] });

          // Redirect to /chat only after confirmation, if it was the active chat
          if (deletingChatId === chatId) {
            router.push("/chat");
          }
        } catch (error) {
          console.error(error);
          // Restore on failure
          queryClient.setQueryData(["chats-list"], previousChats);
          toast.error("Failed to delete chat");
        }
      },
    });
  };

  return (
    <>
      <DeleteChatModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={false}
        chatName={deleteName}
      />

      <div
        className={cn(
          "h-screen relative flex-shrink-0 transition-all duration-300 ease-in-out bg-sidebar border-r overflow-hidden",
          isOpen ? "w-[280px] border-sidebar-border" : "w-[64px] border-sidebar-border"
        )}
      >
        <div className={cn("absolute top-0 left-0 h-full w-[280px] transition-opacity duration-300", isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
          <ExpandedSidebar
            className={cn("border-none shadow-none bg-transparent", className)}
            onToggle={toggleSidebar}
            chats={chats}
            chatId={chatId}
            isPro={isPro}
            onDeleteChat={confirmDelete}
          />
        </div>
        <div className={cn("absolute top-0 left-0 h-full w-[64px] transition-opacity duration-300", !isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}>
          <CollapsedSidebar
            className={cn("border-none shadow-none bg-transparent", className)}
            onToggle={toggleSidebar}
            chats={chats}
            chatId={chatId}
            isPro={isPro}
          />
        </div>
      </div>
    </>
  );
};

export default memo(ChatSidebar);

"use client";

import { DrizzleChat } from "@/lib/db/schema";
import React, { useState, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import DeleteChatModal from "./DeleteChatModal";
import axios from "axios";
import toast from "react-hot-toast";
import ExpandedSidebar from "./sidebar/ExpandedSidebar";
import CollapsedSidebar from "./sidebar/CollapsedSidebar";

type Props = {
  chats: DrizzleChat[];
  chatId?: string;
  className?: string;
  isPro: boolean;
};

// Main ChatSidebar Component
const ChatSidebar = ({ chats, chatId: propChatId, className, isPro }: Props) => {
  const params = useParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

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

    try {
      setIsDeleting(true);
      const response = await axios.delete("/api/delete-chat", {
        data: { chatId: deleteId },
      });

      if (response.status === 200) {
        toast.success("Chat deleted!");
        setDeleteId(null);
        setDeleteName("");
        router.refresh();

        // If we deleted the current chat, redirect to home
        if (deleteId === chatId) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DeleteChatModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        chatName={deleteName}
      />

      {isOpen ? (
        <ExpandedSidebar
          className={className}
          onToggle={toggleSidebar}
          chats={chats}
          chatId={chatId}
          isPro={isPro}
          onDeleteChat={confirmDelete}
        />
      ) : (
        <CollapsedSidebar
          className={className}
          onToggle={toggleSidebar}
          chats={chats}
          chatId={chatId}
          isPro={isPro}
        />
      )}
    </>
  );
};

export default memo(ChatSidebar);

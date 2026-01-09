"use client";

import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React, { useState, useMemo, memo } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { IoMdHome } from "react-icons/io";
import { FaBars, FaPlus } from "react-icons/fa";
import { FiMessageSquare, FiTrash } from "react-icons/fi";
import UpgradeButton from "./UpgradeButton";
import DeleteChatModal from "./DeleteChatModal";
import axios from "axios";
import toast from "react-hot-toast";
import ThemeToggle from "./ThemeToggle";

type Props = {
  chats: DrizzleChat[];
  chatId?: string;
  className?: string;
  isPro: boolean;
};

// Extracted ChatItem component for better performance
const ChatItem = memo(
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
          <FiMessageSquare className="mr-3 w-4 h-4 flex-shrink-0" />
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

// Extracted CollapsedChatItem component
const CollapsedChatItem = memo(({ chat, isActive }: { chat: DrizzleChat; isActive: boolean }) => (
  <Link
    key={chat.id}
    href={`/chat/${chat.id}`}>
    <div
      className={cn(
        "p-3 rounded-lg transition-colors",
        isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
      )}>
      <FiMessageSquare size={16} />
    </div>
  </Link>
));
CollapsedChatItem.displayName = "CollapsedChatItem";

// Extracted Header component
const SidebarHeader = memo(({ onToggle }: { onToggle: () => void }) => (
  <div className="mb-6 px-2 flex items-center justify-between">
    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
      <span className="text-blue-500">PDF</span> Chat.ai
    </h1>
    <button
      className="bg-slate-700 p-2 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
      onClick={onToggle}
      aria-label="Toggle sidebar">
      <FaBars
        className="text-white"
        size={16}
      />
    </button>
  </div>
));
SidebarHeader.displayName = "SidebarHeader";

// Extracted Footer component
const SidebarFooter = memo(({ isPro, chatCount }: { isPro: boolean; chatCount: number }) => (
  <div className="mt-4 pt-4 border-t border-slate-800 dark:border-slate-700 flex flex-col gap-4">
    <div className="px-2">
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
        {isPro ? "Pro Plan" : `${chatCount} / 3 Free PDFs used`}
      </p>
      <UpgradeButton isPro={isPro} />
    </div>
    <div className="flex flex-col gap-1">
      <Link
        href="/"
        className="flex items-center p-2 rounded-md text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-200 hover:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors text-sm">
        <IoMdHome className="w-4 h-4 mr-3" />
        Home
      </Link>
      <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Theme</span>
        <ThemeToggle variant="sidebar" />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-600 px-2 mt-2">© 2025 PDF Chat AI</p>
    </div>
  </div>
));
SidebarFooter.displayName = "SidebarFooter";

// Expanded Sidebar Component
const ExpandedSidebar = memo(
  ({
    className,
    onToggle,
    chats,
    chatId,
    isPro,
    onDeleteChat,
  }: {
    className?: string;
    onToggle: () => void;
    chats: DrizzleChat[];
    chatId: string;
    isPro: boolean;
    onDeleteChat: (e: React.MouseEvent, chatId: string, chatName: string) => void;
  }) => (
    <div
      className={cn(
        "w-[280px] h-screen p-4 bg-slate-900 flex flex-col border-r border-slate-800 shadow-xl",
        "transition-all duration-300 ease-in-out",
        className,
      )}>
      <SidebarHeader onToggle={onToggle} />

      <Link
        href="/"
        className="w-full">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] h-10 rounded-lg justify-start px-4">
          <FaPlus className="mr-2 w-4 h-4" />
          <span className="font-semibold">New Chat</span>
        </Button>
      </Link>

      <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-2 pr-2 custom-scrollbar">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Your Chats</p>

        {chats.length === 0 ? (
          <div className="px-2 text-slate-500 text-sm italic">No chats yet.</div>
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

      <SidebarFooter
        isPro={isPro}
        chatCount={chats.length}
      />
    </div>
  ),
);
ExpandedSidebar.displayName = "ExpandedSidebar";

// Collapsed Sidebar Component
const CollapsedSidebar = memo(
  ({
    className,
    onToggle,
    chats,
    chatId,
  }: {
    className?: string;
    onToggle: () => void;
    chats: DrizzleChat[];
    chatId: string;
  }) => (
    <div
      className={cn(
        "h-screen w-[64px] bg-slate-900 border-r border-slate-800 shadow-xl flex flex-col items-center py-4 gap-6",
        "transition-all duration-300 ease-in-out",
        className,
      )}>
      <button
        onClick={onToggle}
        className="bg-slate-700 p-2 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
        aria-label="Expand sidebar">
        <FaBars
          className="text-white"
          size={14}
        />
      </button>

      <Link href="/">
        <div className="bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition">
          <FaPlus
            className="text-white"
            size={16}
          />
        </div>
      </Link>

      <div className="flex flex-col items-center gap-4 mt-4 flex-1">
        {chats.map((chat) => (
          <CollapsedChatItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === chatId}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <ThemeToggle variant="sidebar" />
        <Link href="/">
          <IoMdHome
            className="text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-200 transition"
            size={18}
          />
        </Link>
      </div>
    </div>
  ),
);
CollapsedSidebar.displayName = "CollapsedSidebar";

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
        />
      )}
    </>
  );
};

export default memo(ChatSidebar);

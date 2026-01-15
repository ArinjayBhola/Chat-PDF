import React, { memo } from "react";
import Link from "next/link";
import { FiMessageSquare, FiTrash } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";

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

export const CollapsedChatItem = memo(({ chat, isActive }: { chat: DrizzleChat; isActive: boolean }) => (
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

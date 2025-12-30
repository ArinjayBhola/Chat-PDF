"use client";

import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { IoMdHome } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { FiMessageSquare } from "react-icons/fi";

type Props = {
  chats: DrizzleChat[];
  chatId?: string;
  className?: string;
};

const ChatSidebar = ({ chats, chatId: propChatId, className }: Props) => {
  const params = useParams();
  const chatId = propChatId || (params?.chatId as string);

  return (
    <div
      className={cn("w-full h-screen p-4 bg-slate-900 flex flex-col border-r border-slate-800 shadow-xl", className)}>
      {/* Header / Logo Area */}
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-blue-500">PDF</span> Chat.ai
        </h1>
      </div>

      <Link
        href={"/"}
        className="w-full">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] h-10 rounded-lg justify-start px-4">
          <FaPlus className="mr-2 w-4 h-4" />
          <span className="font-semibold">New Chat</span>
        </Button>
      </Link>

      <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-2 pr-2 custom-scrollbar">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Your Chats</p>

        {chats.length === 0 && <div className="px-2 text-slate-500 text-sm italic">No chats yet.</div>}

        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={"/chat/" + chat.id}>
            <div
              className={cn(
                "rounded-lg p-3 flex items-center transition-all duration-200 group relative overflow-hidden",
                {
                  "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700": chat.id === chatId,
                  "text-slate-400 hover:text-white hover:bg-slate-800/50": chat.id !== chatId,
                },
              )}>
              <FiMessageSquare className="mr-3 w-4 h-4 flex-shrink-0" />
              <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap font-medium tracking-wide">
                {chat.pdfName}
              </p>
              {chat.id === chatId && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l" />}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-sm">
            <IoMdHome className="w-4 h-4 mr-3" />
            Home
          </Link>
          <p className="text-[10px] text-slate-500 px-2 mt-2">© 2025 PDF Chat AI</p>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;

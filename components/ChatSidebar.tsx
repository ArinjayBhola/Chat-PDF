"use client";

import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

type Props = {
  chats: DrizzleChat[];
  chatId?: string; // Made optional
};

const ChatSidebar = ({ chats, chatId: propChatId }: Props) => {
  const params = useParams();
  const chatId = propChatId || (params?.chatId as string);

  return (
    <div className="w-full h-screen p-4 text-gray-200 bg-gray-900 flex flex-col">
      <Link href={"/"}>
        <Button className="w-full border-dashed border-white border mb-4">
          <PlusCircle className="mr-2 w-4 h-4" />
          New Chat
        </Button>
      </Link>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={"/chat/" + chat.id}>
            <div
              className={cn("rounded-lg text-slate-300 p-3 flex items-center", {
                "bg-blue-600 text-white": chat.id === chatId,
                "hover:bg-gray-700": chat.id !== chatId,
              })}>
              <MessageCircle className="mr-2" />
              <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis">{chat.pdfName}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-700 pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link href={"/"}>Home</Link>
          <Link href={"/"}>Source</Link>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;

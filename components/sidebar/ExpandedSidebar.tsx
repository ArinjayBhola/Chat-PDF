import React, { memo } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import { ChatItem } from "./ChatItem";
import FileUpload from "../FileUpload";
import { RiLoader2Fill } from "react-icons/ri";

type Props = {
  className?: string;
  onToggle: () => void;
  chats: DrizzleChat[];
  chatId: string;
  isPro: boolean;
  onDeleteChat: (e: React.MouseEvent, chatId: string, chatName: string) => void;
};

const ExpandedSidebar = memo(({ className, onToggle, chats, chatId, isPro, onDeleteChat }: Props) => {
  const currentChat = chats.find((c) => c.id === chatId);

  return (
    <div
      className={cn(
        "w-[280px] h-screen p-4 bg-slate-900 flex flex-col border-r border-slate-800 shadow-xl",
        "transition-all duration-300 ease-in-out",
        className,
      )}>
      <SidebarHeader onToggle={onToggle} />

      <FileUpload
        isPro={isPro}
        chatCount={chats.length}>
        {({ isUploading }) => (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] h-10 rounded-lg justify-start px-4"
            disabled={isUploading}>
            {isUploading ? (
              <RiLoader2Fill className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <FaPlus className="mr-2 w-4 h-4" />
            )}
            <span className="font-semibold">{isUploading ? "Uploading..." : "New Chat"}</span>
          </Button>
        )}
      </FileUpload>

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
  );
});

ExpandedSidebar.displayName = "ExpandedSidebar";

export default ExpandedSidebar;

import React, { memo } from "react";
import Link from "next/link";
import { FaBars, FaPlus } from "react-icons/fa";
import { IoMdHome } from "react-icons/io";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";
import ThemeToggle from "../ThemeToggle";
import FileUpload from "../FileUpload";
import { RiLoader2Fill } from "react-icons/ri";

type Props = {
  className?: string;
  onToggle: () => void;
  chats: DrizzleChat[];
  chatId: string;
  isPro: boolean;
};

const CollapsedSidebar = memo(({ className, onToggle, chats, chatId, isPro }: Props) => (
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

    <FileUpload
      isPro={isPro}
      chatCount={chats.length}>
      {({ isUploading }) => (
        <div className={cn("bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition cursor-pointer", isUploading && "opacity-50 pointer-events-none")}>
          {isUploading ? (
            <RiLoader2Fill
              className="text-white animate-spin"
              size={16}
            />
          ) : (
            <FaPlus
              className="text-white"
              size={16}
            />
          )}
        </div>
      )}
    </FileUpload>

    <div className="flex flex-col items-center gap-4 mt-4 flex-1">
      {/* Chat list hidden in collapsed mode as per user request */}
      {/* {chats.map((chat) => (
        <CollapsedChatItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === chatId}
        />
      ))} */}
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
));

CollapsedSidebar.displayName = "CollapsedSidebar";

export default CollapsedSidebar;

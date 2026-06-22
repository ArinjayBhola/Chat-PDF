// UI REDESIGN
import React, { memo, useState } from "react";
import Link from "next/link";
import { FaBars, FaPlus } from "react-icons/fa";
import { IoMdHome } from "react-icons/io";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";
import ThemeToggle from "../ThemeToggle";
import FileUpload from "../FileUpload";
import { RiLoader2Fill } from "react-icons/ri";
import { LuGitCompareArrows } from "react-icons/lu";
import { CompareDialog } from "../CompareDialog";

type Props = {
  className?: string;
  onToggle: () => void;
  chats: DrizzleChat[];
  chatId: string;
  isPro: boolean;
};

const CollapsedSidebar = memo(({ className, onToggle, chats, chatId, isPro }: Props) => {
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  return (
    <div
      className={cn(
        "h-screen w-[64px] bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-6",
        "transition-all duration-300 ease-in-out",
        className,
      )}>
      <button
        onClick={onToggle}
        className="bg-muted p-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
        aria-label="Expand sidebar">
        <FaBars
          className="text-foreground"
          size={14}
        />
      </button>

      <FileUpload
        isPro={isPro}
        chatCount={chats.length}>
        {({ isUploading }) => (
          <div className={cn("w-10 h-10 flex items-center justify-center bg-primary rounded-lg hover:bg-primary/90 text-primary-foreground transition-all duration-200 cursor-pointer mx-auto active:scale-95", isUploading && "opacity-50 pointer-events-none")}>
            {isUploading ? (
              <RiLoader2Fill
                className="text-primary-foreground animate-spin"
                size={16}
              />
            ) : (
              <FaPlus
                className="text-primary-foreground"
                size={16}
              />
            )}
          </div>
        )}
      </FileUpload>

      <div className="flex flex-col items-center gap-4 mt-4 flex-1">
        {chats.length >= 2 && (
          <>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Compare Documents"
            >
              <LuGitCompareArrows size={18} />
            </button>
            <CompareDialog
              open={isCompareOpen}
              onOpenChange={setIsCompareOpen}
              chats={chats}
            />
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <ThemeToggle variant="sidebar" />
        <Link href="/">
          <IoMdHome
            className="text-muted-foreground hover:text-foreground transition-colors"
            size={18}
          />
        </Link>
      </div>
    </div>
  );
});

CollapsedSidebar.displayName = "CollapsedSidebar";

export default CollapsedSidebar;

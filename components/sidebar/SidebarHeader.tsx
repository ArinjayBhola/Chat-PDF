// UI REDESIGN
import React, { memo } from "react";
import { FaBars, FaLongArrowAltLeft } from "react-icons/fa";
import { LuFileText } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SidebarHeader = memo(({ onToggle }: { onToggle: () => void }) => {
  const router = useRouter();

  return (
    <div className="mb-6 px-1 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Go back">
          <FaLongArrowAltLeft className="w-4.5 h-4.5" />
        </button>
        <Link href="/" className="flex items-center gap-2 transition-transform duration-200 active:scale-95">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LuFileText className="h-4 w-4" />
          </span>
          <h1 className="text-base font-bold text-foreground tracking-tight select-none">
            <span className="text-primary">Docs</span>Chat
          </h1>
        </Link>
      </div>
      <button
        className="bg-muted p-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={onToggle}
        aria-label="Toggle sidebar">
        <FaBars
          className="text-foreground"
          size={14}
        />
      </button>
    </div>
  );
});

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;

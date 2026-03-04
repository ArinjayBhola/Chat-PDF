import React, { memo } from "react";
import { FaBars, FaLongArrowAltLeft } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SidebarHeader = memo(({ onToggle }: { onToggle: () => void }) => {
  const router = useRouter();

  return (
    <div className="mb-6 px-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Go back">
          <FaLongArrowAltLeft className="w-5 h-5" />
        </button>
        <Link href="/">
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span className="text-primary">Docs</span> Chat.ai
          </h1>
        </Link>
      </div>
      <button
        className="bg-muted p-2 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={onToggle}
        aria-label="Toggle sidebar">
        <FaBars
          className="text-foreground"
          size={16}
        />
      </button>
    </div>
  );
});

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;

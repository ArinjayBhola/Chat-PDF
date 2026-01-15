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
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          aria-label="Go back">
          <FaLongArrowAltLeft className="w-5 h-5" />
        </button>
        <Link href="/">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-500">PDF</span> Chat.ai
          </h1>
        </Link>
      </div>
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
  );
});

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;

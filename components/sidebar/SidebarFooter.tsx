import React, { memo } from "react";
import Link from "next/link";
import { IoMdHome } from "react-icons/io";
import UpgradeButton from "../UpgradeButton";
import ThemeToggle from "../ThemeToggle";

type Props = {
  isPro: boolean;
  chatCount: number;
};

const SidebarFooter = memo(({ isPro, chatCount }: Props) => (
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
        className="flex items-center px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium text-sm">
        <IoMdHome className="w-4 h-4 mr-3" />
        Home
      </Link>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
        <span className="text-sm text-muted-foreground font-medium">Theme</span>
        <ThemeToggle variant="sidebar" />
      </div>
    </div>
  </div>
));

SidebarFooter.displayName = "SidebarFooter";

export default SidebarFooter;

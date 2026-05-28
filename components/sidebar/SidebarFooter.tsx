// UI REDESIGN
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
  <div className="mt-4 pt-4 border-t border-sidebar-border flex flex-col gap-4">
    <div className="px-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {isPro ? "Pro Plan Active" : `${chatCount} / 3 Uploads Used`}
      </p>
      {!isPro && (
        <div className="w-full bg-sidebar-border h-1.5 rounded-md mb-2.5 overflow-hidden">
          <div
            className={`h-full rounded-md transition-all duration-500 ${chatCount >= 3 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${Math.min((chatCount / 3) * 100, 100)}%` }}
          />
        </div>
      )}
      <UpgradeButton isPro={isPro} />
    </div>
    <div className="flex flex-col gap-0.5">
      <Link
        href="/"
        className="flex items-center px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-semibold text-sm">
        <IoMdHome className="w-4 h-4 mr-3 text-muted-foreground" />
        Home
      </Link>
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
        <span className="text-sm text-muted-foreground font-semibold">Theme</span>
        <ThemeToggle variant="sidebar" />
      </div>
    </div>
  </div>
));

SidebarFooter.displayName = "SidebarFooter";

export default SidebarFooter;

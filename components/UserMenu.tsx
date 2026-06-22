// UI REDESIGN
"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { MdLogout } from "react-icons/md";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string;
    image?: string | null;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <div
        className="relative"
        ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow ring-1 ring-border hover:ring-primary/45 active:scale-95">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm select-none">
              {userInitial}
            </span>
          )}
        </button>

        {isOpen && (
          <div className={cn(
            "absolute right-0 mt-2 w-56 bg-popover rounded-2xl shadow-lg border border-border py-1.5 z-50 overflow-hidden",
            "animate-in fade-in slide-in-from-top-2 duration-150"
          )}>
            <div className="flex items-center gap-3 p-3 bg-muted/40 border-b border-border">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm select-none">
                  {userInitial}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="px-1.5 py-1">
              <div className="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-muted/50 transition-colors">
                <span className="text-sm text-foreground font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </div>

            <div className="border-t border-border my-1" />

            <div className="px-1.5 py-0.5">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="group w-full px-2.5 py-2 text-left text-sm text-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors flex items-center gap-2.5 font-medium">
                <MdLogout className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

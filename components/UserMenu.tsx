"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { MdLogout } from "react-icons/md";

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
    <div
      className="relative"
      ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg ring-2 ring-slate-200 hover:ring-slate-300">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-lg select-none">
            {userInitial}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden">
          <div className="flex items-center gap-1 bg-slate-50/50">
            <div>
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full ml-2"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-lg select-none ml-2">
                  {userInitial}
                </span>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{user.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="border-b-2 border-slate-200 mx-1" />

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="group w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-red-500 transition-colors flex items-center gap-2.5 font-medium">
            <MdLogout className="w-4 h-4 text-slate-500 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

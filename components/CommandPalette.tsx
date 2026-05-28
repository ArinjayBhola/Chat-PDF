// UI REDESIGN
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DrizzleChat, DrizzleFolder } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  LuSearch,
  LuFileText,
  LuFolder,
  LuPlus,
  LuHouse,
  LuSettings,
  LuSun,
  LuMoon,
  LuCommand,
} from "react-icons/lu";
import { useTheme } from "next-themes";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Fetch chats and folders for navigation
  const { data: chats = [] } = useQuery<DrizzleChat[]>({
    queryKey: ["chats-list"],
    queryFn: async () => {
      const res = await axios.get("/api/chats");
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: folders = [] } = useQuery<DrizzleFolder[]>({
    queryKey: ["folders-list"],
    queryFn: async () => {
      const res = await axios.get("/api/folders");
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setQuery("");
          setSelectedIndex(0);
        }
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Quick actions
    items.push({
      id: "home",
      label: "Go to Home",
      description: "Upload new documents",
      icon: <LuHouse className="w-4 h-4" />,
      category: "Navigation",
      action: () => { router.push("/"); close(); },
      keywords: ["home", "upload", "new"],
    });

    items.push({
      id: "settings",
      label: "Settings",
      description: "Manage your account and preferences",
      icon: <LuSettings className="w-4 h-4" />,
      category: "Navigation",
      action: () => { router.push("/settings"); close(); },
      keywords: ["settings", "preferences", "account"],
    });

    items.push({
      id: "theme",
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: "Toggle the color theme",
      icon: theme === "dark" ? <LuSun className="w-4 h-4" /> : <LuMoon className="w-4 h-4" />,
      category: "Actions",
      action: () => { setTheme(theme === "dark" ? "light" : "dark"); close(); },
      keywords: ["theme", "dark", "light", "mode", "toggle"],
    });

    items.push({
      id: "new-chat",
      label: "New Chat",
      description: "Upload a document and start chatting",
      icon: <LuPlus className="w-4 h-4" />,
      category: "Actions",
      action: () => { router.push("/"); close(); },
      keywords: ["new", "upload", "create", "chat"],
    });

    // Chats
    for (const chat of chats) {
      const folder = chat.folderId ? folders.find((f) => f.id === chat.folderId) : null;
      items.push({
        id: `chat-${chat.id}`,
        label: chat.fileName,
        description: folder ? `in ${folder.name}` : undefined,
        icon: <LuFileText className="w-4 h-4" />,
        category: "Chats",
        action: () => { router.push(`/chat/${chat.id}`); close(); },
        keywords: [chat.fileName.toLowerCase()],
      });
    }

    // Folders
    for (const folder of folders) {
      items.push({
        id: `folder-${folder.id}`,
        label: folder.name,
        description: `${chats.filter((c) => c.folderId === folder.id).length} chats`,
        icon: <LuFolder className="w-4 h-4" />,
        category: "Folders",
        action: () => close(), // Folders don't navigate, just show info
        keywords: [folder.name.toLowerCase()],
      });
    }

    return items;
  }, [chats, folders, theme, router, close, setTheme]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(q)) return true;
      if (cmd.description?.toLowerCase().includes(q)) return true;
      if (cmd.keywords?.some((k) => k.includes(q))) return true;
      return false;
    });
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const existing = groups.get(item.category) || [];
      existing.push(item);
      groups.set(item.category, existing);
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const items: CommandItem[] = [];
    for (const group of grouped.values()) {
      items.push(...group);
    }
    return items;
  }, [grouped]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatList[selectedIndex]) {
      e.preventDefault();
      flatList[selectedIndex].action();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={close}
      />

      {/* Palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <LuSearch className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search chats, actions, settings..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2 custom-scrollbar">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category}>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    {category}
                  </p>
                  {items.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100",
                          idx === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-md shrink-0",
                          idx === selectedIndex ? "bg-primary/20" : "bg-muted"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          )}
                        </div>
                        {idx === selectedIndex && (
                          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded shrink-0">
                            Enter
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted border border-border rounded font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted border border-border rounded font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted border border-border rounded font-mono">Esc</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <LuCommand className="w-3 h-3" />
              <span>Command Palette</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

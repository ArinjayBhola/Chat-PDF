// UI REDESIGN
"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { LuSparkles, LuLanguages, LuTextQuote } from "react-icons/lu";

export type SelectionAction = "explain" | "summarize" | "translate";

interface FloatingMenuProps {
  onAction: (action: SelectionAction, text: string) => void;
}

export function FloatingMenu({ onAction }: FloatingMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        setSelectedText("");
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Set position above the selection, ensuring it stays within viewport
      const menuWidth = 240; // Approx width
      const menuHeight = 40;
      
      let left = rect.left + rect.width / 2;
      let top = rect.top - menuHeight - 10;

      // Bound left
      if (left < menuWidth / 2 + 10) left = menuWidth / 2 + 10;
      if (left > window.innerWidth - menuWidth / 2 - 10) left = window.innerWidth - menuWidth / 2 - 10;

      // Bound top (if too close to top, show below selection)
      if (top < 10) top = rect.bottom + 10;

      setPosition({ top, left });
      setSelectedText(selection.toString().trim());
    };

    const handleMouseUp = () => {
      // Delay slightly to allow selection to finalize
      setTimeout(handleSelectionChange, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // If clicking inside the menu, don't clear
      if (menuRef.current?.contains(e.target as Node)) return;
      setPosition(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] flex items-center gap-1 p-1 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <MenuButton
        icon={<LuSparkles className="w-3.5 h-3.5" />}
        label="Explain"
        onClick={() => onAction("explain", selectedText)}
      />
      <div className="w-[1px] h-4 bg-border mx-0.5" />
      <MenuButton
        icon={<LuTextQuote className="w-3.5 h-3.5" />}
        label="Summarize"
        onClick={() => onAction("summarize", selectedText)}
      />
      <div className="w-[1px] h-4 bg-border mx-0.5" />
      <MenuButton
        icon={<LuLanguages className="w-3.5 h-3.5" />}
        label="Translate"
        onClick={() => onAction("translate", selectedText)}
      />
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-all duration-200 active:scale-95 group"
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[11px] font-bold tracking-tight uppercase">{label}</span>
    </button>
  );
}

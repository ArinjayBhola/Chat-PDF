"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  variant?: "default" | "sidebar";
};

export default function ThemeToggle({ className, variant = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses =
    variant === "sidebar"
      ? "flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/80 transition-colors"
      : "flex items-center justify-center w-10 h-10 rounded-xl bg-muted hover:bg-muted/80 transition-colors";

  const iconClasses =
    variant === "sidebar" ? "w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" : "w-5 h-5 text-foreground";

  if (!mounted) {
    return (
      <button className={cn(baseClasses, className)}>
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(baseClasses, className)}
      aria-label="Toggle theme">
      {theme === "dark" ? <MdLightMode className={iconClasses} /> : <MdDarkMode className={iconClasses} />}
    </button>
  );
}

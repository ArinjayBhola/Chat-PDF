"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type InterfaceSize = "comfortable" | "compact";
type ThemeColor = "default" | "orange" | "amber" | "rose" | "emerald";

interface PreferencesContextType {
  interfaceSize: InterfaceSize;
  setInterfaceSize: (size: InterfaceSize) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  isMounted: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [interfaceSize, setInterfaceSize] = useState<InterfaceSize>("comfortable");
  const [themeColor, setThemeColor] = useState<ThemeColor>("default");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage on mount
    const savedSize = localStorage.getItem("chatpdf-size") as InterfaceSize;
    const savedColor = localStorage.getItem("chatpdf-color") as ThemeColor;
    
    if (savedSize) setInterfaceSize(savedSize);
    if (savedColor) setThemeColor(savedColor);
    
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Save to localStorage
    localStorage.setItem("chatpdf-size", interfaceSize);
    localStorage.setItem("chatpdf-color", themeColor);
    
    // Apply to document for global CSS targeting
    document.documentElement.setAttribute("data-size", interfaceSize);
    document.documentElement.setAttribute("data-theme-color", themeColor);
  }, [interfaceSize, themeColor, isMounted]);

  return (
    <PreferencesContext.Provider
      value={{
        interfaceSize,
        setInterfaceSize,
        themeColor,
        setThemeColor,
        isMounted,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

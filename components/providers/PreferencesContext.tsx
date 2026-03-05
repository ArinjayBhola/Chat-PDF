"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type InterfaceSize = "comfortable" | "compact";
type ThemeColor = "default" | "red" | "amber" | "rose" | "emerald";
type ChatAppearance = "modern" | "classic";
type Typography = "sans" | "serif" | "mono";

interface PreferencesContextType {
  interfaceSize: InterfaceSize;
  setInterfaceSize: (size: InterfaceSize) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  chatAppearance: ChatAppearance;
  setChatAppearance: (app: ChatAppearance) => void;
  typography: Typography;
  setTypography: (font: Typography) => void;
  isMounted: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [interfaceSize, setInterfaceSize] = useState<InterfaceSize>("comfortable");
  const [themeColor, setThemeColor] = useState<ThemeColor>("default");
  const [chatAppearance, setChatAppearance] = useState<ChatAppearance>("modern");
  const [typography, setTypography] = useState<Typography>("sans");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage on mount
    const savedSize = localStorage.getItem("chatpdf-size") as InterfaceSize;
    const savedColor = localStorage.getItem("chatpdf-color") as ThemeColor;
    const savedApp = localStorage.getItem("chatpdf-appearance") as ChatAppearance;
    const savedFont = localStorage.getItem("chatpdf-typography") as Typography;
    
    if (savedSize) setInterfaceSize(savedSize);
    if (savedColor) setThemeColor(savedColor);
    if (savedApp) setChatAppearance(savedApp);
    if (savedFont) setTypography(savedFont);
    
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Save to localStorage
    localStorage.setItem("chatpdf-size", interfaceSize);
    localStorage.setItem("chatpdf-color", themeColor);
    localStorage.setItem("chatpdf-appearance", chatAppearance);
    localStorage.setItem("chatpdf-typography", typography);
    
    // Apply to document for global CSS targeting
    document.documentElement.setAttribute("data-size", interfaceSize);
    document.documentElement.setAttribute("data-theme-color", themeColor);
    document.documentElement.setAttribute("data-chat-appearance", chatAppearance);
    document.documentElement.setAttribute("data-typography", typography);
  }, [interfaceSize, themeColor, chatAppearance, typography, isMounted]);

  return (
    <PreferencesContext.Provider
      value={{
        interfaceSize,
        setInterfaceSize,
        themeColor,
        setThemeColor,
        chatAppearance,
        setChatAppearance,
        typography,
        setTypography,
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

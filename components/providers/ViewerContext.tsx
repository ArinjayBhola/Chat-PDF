"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ViewerState = {
  activeChatId: string | null;
  viewers: Record<string, { url: string; name: string }>;
};

type ViewerContextType = {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  registerViewer: (id: string, url: string, name: string) => void;
  refreshViewer: (id: string) => void;
  refreshKeys: Record<string, number>;
};

const ViewerContext = createContext<ViewerContextType | undefined>(undefined);

export function ViewerProvider({ children }: { children: ReactNode }) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [viewers, setViewers] = useState<Record<string, { url: string; name: string }>>({});
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  const registerViewer = (id: string, url: string, name: string) => {
    setViewers((prev) => {
      if (prev[id]?.url === url) return prev;
      return { ...prev, [id]: { url, name } };
    });
  };

  const refreshViewer = (id: string) => {
    setRefreshKeys((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  return (
    <ViewerContext.Provider
      value={{
        activeChatId,
        setActiveChatId,
        registerViewer,
        refreshViewer,
        refreshKeys,
      }}
    >
      {children}
      {/* Global Hidden Container for Persistent Viewers */}
      <div className="persistent-viewers-container hidden">
        {/* We'll handle the actual persistent rendering in a separate component or logic */}
      </div>
    </ViewerContext.Provider>
  );
}

export const useViewer = () => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }
  return context;
};

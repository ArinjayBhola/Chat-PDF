"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { createContext, useContext, useState } from "react";

type GlobalLoadingContextType = {
  isGlobalLoading: boolean;
  setIsGlobalLoading: (loading: boolean) => void;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  }
  return context;
};

const queryClient = new QueryClient();

type Props = {
  children: React.ReactNode;
};

const Provider = ({ children }: Props) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoadingContext.Provider value={{ isGlobalLoading, setIsGlobalLoading }}>
        {children}
      </GlobalLoadingContext.Provider>
    </QueryClientProvider>
  );
};

export default Provider;

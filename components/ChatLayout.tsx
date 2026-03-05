"use client";

import React, { useState } from "react";
import FileViewer from "@/components/FileViewer";
import ChatComponent from "@/components/ChatComponent";
import ResizableSplit from "@/components/ResizableSplit";
import { DrizzleChat } from "@/lib/db/schema";
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "./ShareDialog";
import { cn } from "@/lib/utils";
import { useViewer } from "./providers/ViewerContext";
import { LuFileBox, LuFileX, LuShare2, LuRotateCcw, LuNotebook } from "react-icons/lu";
import NotesSidebar from "@/components/NotesSidebar";

type Props = {
  chat: DrizzleChat;
  isOwner: boolean;
  session: Session | null;
};

export default function ChatLayout({ chat, isOwner, session }: Props) {
  const [hideDocument, setHideDocument] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const [activeMobileTab, setActiveMobileTab] = useState<"file" | "chat">("chat");

  const shareData = {
    isShared: chat.isShared === "true",
    sharePermission: (chat.sharePermission as "view" | "edit") || "view",
    allowPublicView: chat.allowPublicView === "true",
    shareToken: chat.shareToken || undefined,
  };

  const { refreshViewer, refreshKeys } = useViewer();
  const currentRefreshKey = refreshKeys[chat.id] || 0;

  const handleNoteAdded = () => {
    setNotesRefreshKey((prev) => prev + 1);
  };

  const headerActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsNotesOpen(!isNotesOpen)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 sm:px-4 border-slate-200 dark:border-slate-800 transition-all duration-200 shadow-sm bg-white dark:bg-slate-900",
          isNotesOpen
            ? "text-[#f97316] border-[#f97316]/50 bg-orange-50/50 dark:bg-orange-950/20"
            : "text-slate-600 dark:text-slate-400 hover:text-[#f97316] hover:border-[#f97316]/30"
        )}
        title={isNotesOpen ? "Hide Notes" : "Show Notes"}
      >
        <LuNotebook className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-semibold">Notes</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => refreshViewer(chat.id)}
        className="flex items-center gap-2 h-9 px-3 sm:px-4 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm"
        title="Reload File"
      >
        <LuRotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-semibold">Reload</span>
      </Button>
      {isOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareOpen(true)}
          className="flex items-center gap-2 h-9 px-3 sm:px-4 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm"
        >
          <LuShare2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Share</span>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setHideDocument(!hideDocument)}
        className={cn(
            "flex items-center gap-2 h-9 px-3 sm:px-4 border-slate-200 dark:border-slate-800 transition-all duration-200 shadow-sm bg-white dark:bg-slate-900",
            hideDocument
                ? "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
        )}
        title={hideDocument ? "Show Document" : "Hide Document"}
      >
        {hideDocument ? <LuFileBox className="w-4 h-4" /> : <LuFileX className="w-4 h-4" />}
        <span className="hidden sm:inline text-xs font-semibold">{hideDocument ? "Show File" : "Hide File"}</span>
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#fafafa] dark:bg-slate-950 relative">
      {/* Mobile Layout */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col h-full">
        <div className="flex-1 flex flex-col h-full">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex justify-between items-center shadow-sm text-slate-800 dark:text-slate-100">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-40 h-9">
              <button
                onClick={() => setActiveMobileTab("file")}
                className={cn(
                    "flex-1 rounded-lg text-xs font-semibold py-1.5 transition-all text-slate-700 dark:text-slate-200",
                    activeMobileTab === "file" && "bg-white dark:bg-slate-700 shadow-sm"
                )}
              >
                File
              </button>
              <button
                onClick={() => setActiveMobileTab("chat")}
                className={cn(
                    "flex-1 rounded-lg text-xs font-semibold py-1.5 transition-all text-slate-700 dark:text-slate-200",
                    activeMobileTab === "chat" && "bg-white dark:bg-slate-700 shadow-sm"
                )}
              >
                Chat
              </button>
            </div>
            {headerActions}
          </div>

          <div className="flex-1 relative overflow-hidden">
            <div className={cn("absolute inset-0 transition-all duration-300", activeMobileTab === "file" ? "opacity-100 translate-x-0 z-10" : "opacity-0 -translate-x-full -z-10 pointer-events-none")}>
              <div className="w-full h-full p-2 bg-white dark:bg-slate-950">
                <FileViewer
                  file_url={chat.fileUrl || ""}
                  file_name={chat.fileName}
                  refreshKey={currentRefreshKey}
                />
              </div>
            </div>
            <div className={cn("absolute inset-0 transition-all duration-300", activeMobileTab === "chat" ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-full -z-10 pointer-events-none")}>
              <ChatComponent
                chatId={chat.id}
                isOwner={isOwner}
                isShared={chat.isShared === "true"}
                sharePermission={chat.sharePermission as "view" | "edit"}
                onNoteAdded={handleNoteAdded}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full h-full overflow-hidden flex-col">
        {/* Header with actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-between items-center z-20 shadow-sm transition-all duration-300 font-sans">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                    <LuFileBox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col min-w-0">
                    <h2 className="text-[13px] sm:text-[14px] font-bold text-slate-900 dark:text-white truncate tracking-tight leading-tight">
                        {chat.fileName}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Active Workspace</span>
                    </div>
                </div>
            </div>
            {headerActions}
        </div>

        <div className="flex-1 overflow-hidden pointer-events-auto flex">
            <div className={cn("flex-1 flex flex-col h-full transition-all duration-500", { "mr-80": isNotesOpen })}>
                <div className={cn("w-full h-full", hideDocument ? "block" : "hidden")}>
                    <div className="w-full h-full max-w-5xl mx-auto bg-white dark:bg-slate-900 border-x border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                        <ChatComponent
                            chatId={chat.id}
                            isOwner={isOwner}
                            isShared={chat.isShared === "true"}
                            sharePermission={chat.sharePermission as "view" | "edit"}
                            onNoteAdded={handleNoteAdded}
                        />
                    </div>
                </div>

                <div className={cn("w-full h-full", hideDocument ? "hidden" : "block")}>
                    <ResizableSplit
                    leftPanel={
                      <div className="w-full h-full overflow-hidden border-r border-slate-200 dark:border-slate-700 bg-[#f8f9fa] dark:bg-slate-950">
                        <FileViewer
                          file_url={chat.fileUrl || ""}
                          file_name={chat.fileName}
                          refreshKey={currentRefreshKey}
                        />
                      </div>
                    }
                    rightPanel={
                      <div className="w-full h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-10 flex flex-col">
                        <ChatComponent
                          chatId={chat.id}
                          isOwner={isOwner}
                          isShared={chat.isShared === "true"}
                          sharePermission={chat.sharePermission as "view" | "edit"}
                          onNoteAdded={handleNoteAdded}
                        />
                      </div>
                    }
                    defaultLeftWidth={60}
                    minLeftWidth={30}
                    minRightWidth={30}
                    storageKey={`chat-split-${chat.id}`}
                  />
                </div>
            </div>

            {/* Integrated Notes Sidebar */}
            <div className={cn(
              "fixed top-[65px] bottom-0 right-0 w-80 z-20 transition-transform duration-500 ease-in-out bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl",
              isNotesOpen ? "translate-x-0" : "translate-x-full"
            )}>
              <NotesSidebar 
                chatId={chat.id} 
                isOpen={isNotesOpen} 
                onClose={() => setIsNotesOpen(false)} 
                refreshKey={notesRefreshKey}
              />
            </div>
        </div>
      </div>

      {isOwner && (
        <ShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          chatId={chat.id}
          initialData={shareData}
        />
      )}
    </div>
  );
}

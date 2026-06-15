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
import { LuFileBox, LuFileX, LuShare2, LuRotateCcw, LuNotebook, LuBrain, LuTrash2 } from "react-icons/lu";
import toast from "react-hot-toast";
import axios from "axios";
import NotesSidebar from "@/components/NotesSidebar";
import { FloatingMenu, SelectionAction } from "./FloatingMenu";
import MindMapDialog from "@/components/MindMapDialog";
import ClearChatModal from "@/components/ClearChatModal";

type Props = {
  chat: DrizzleChat;
  isOwner: boolean;
  session: Session | null;
  isSharedView?: boolean;
};

export default function ChatLayout({ chat, isOwner, session, isSharedView = false }: Props) {
  const [hideDocument, setHideDocument] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
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

  const handleSelectionAction = (action: SelectionAction, text: string) => {
    window.dispatchEvent(
      new CustomEvent("selection-action", {
        detail: { action, text, targetChatId: chat.id },
      })
    );
  };

  const headerActions = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {session?.user && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMindMapOpen(true)}
          className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 active:scale-95"
          title="Mind Map"
        >
          <LuBrain className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Mind Map</span>
        </Button>
      )}
      {session?.user && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={cn(
            "flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg transition-all duration-200",
            isNotesOpen
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
          title={isNotesOpen ? "Hide Notes" : "Show Notes"}
        >
          <LuNotebook className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Notes</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => refreshViewer(chat.id)}
        className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 active:scale-95"
        title="Reload File"
      >
        <LuRotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-semibold">Reload</span>
      </Button>
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsShareOpen(true)}
          className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 active:scale-95"
        >
          <LuShare2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Share</span>
        </Button>
      )}
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsClearChatOpen(true)}
          className="flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-95"
          title="Clear Chat"
        >
          <LuTrash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Clear</span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setHideDocument(!hideDocument)}
        className={cn(
            "flex items-center gap-2 h-8 px-2.5 sm:px-3 rounded-lg transition-all duration-200 active:scale-95",
            hideDocument
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
        )}
        title={hideDocument ? "Show Document" : "Hide Document"}
      >
        {hideDocument ? <LuFileBox className="w-4 h-4" /> : <LuFileX className="w-4 h-4" />}
        <span className="hidden sm:inline text-xs font-semibold">{hideDocument ? "Show File" : "Hide File"}</span>
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background relative">
      {/* Mobile Layout */}
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col h-full">
        <div className="flex-1 flex flex-col h-full">
          <div className="px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex justify-between items-center shadow-sm text-foreground">
            <div className="flex bg-muted p-1 rounded-lg w-40 h-9">
              <button
                onClick={() => setActiveMobileTab("file")}
                className={cn(
                    "flex-1 rounded-md text-xs font-semibold py-1.5 transition-all duration-200",
                    activeMobileTab === "file"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                File
              </button>
              <button
                onClick={() => setActiveMobileTab("chat")}
                className={cn(
                    "flex-1 rounded-lg text-xs font-semibold py-1.5 transition-all duration-200",
                    activeMobileTab === "chat"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                Chat
              </button>
            </div>
            {headerActions}
          </div>

          <div className="flex-1 relative overflow-hidden">
            <div className={cn("absolute inset-0 transition-all duration-300", activeMobileTab === "file" ? "opacity-100 translate-x-0 z-10" : "opacity-0 -translate-x-full -z-10 pointer-events-none")}>
              <div className="w-full h-full p-2 bg-background document-viewer-container">
                <FileViewer
                  file_url={chat.fileUrl || ""}
                  file_name={chat.fileName}
                  file_key={chat.fileKey}
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
                isSharedView={isSharedView}
                pdfStatus={chat.pdfStatus}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full h-full overflow-hidden flex-col">
        {/* Header with actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/80 backdrop-blur-md flex justify-between items-center z-30 shadow-sm transition-all duration-300 font-sans">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <LuFileBox className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                    <h2 className="text-[13px] sm:text-[14px] font-bold text-foreground truncate tracking-tight leading-tight">
                        {chat.fileName}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">Active Workspace</span>
                    </div>
                </div>
            </div>
            {headerActions}
        </div>

        <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 flex flex-col h-full min-w-0 relative">
                <ResizableSplit
                  hideLeft={hideDocument}
                  leftPanel={
                    <div className="w-full h-full overflow-hidden border-r border-border bg-muted/30 document-viewer-container">
                      <FileViewer
                        file_url={chat.fileUrl || ""}
                        file_name={chat.fileName}
                        file_key={chat.fileKey}
                        refreshKey={currentRefreshKey}
                      />
                    </div>
                  }
                  rightPanel={
                    <div className={cn(
                      "w-full h-full bg-background flex flex-col",
                      hideDocument
                        ? "max-w-5xl mx-auto border-x border-border shadow-xl ring-1 ring-border/50"
                        : "border-l border-border shadow-2xl z-10"
                    )}>
                      <ChatComponent
                        chatId={chat.id}
                        isOwner={isOwner}
                        isShared={chat.isShared === "true"}
                        sharePermission={chat.sharePermission as "view" | "edit"}
                        onNoteAdded={handleNoteAdded}
                        isSharedView={isSharedView}
                        pdfStatus={chat.pdfStatus}
                      />
                    </div>
                  }
                  defaultLeftWidth={60}
                  minLeftWidth={30}
                  minRightWidth={30}
                  storageKey={`chat-split-${chat.id}`}
                />
            </div>

            {/* Integrated Notes Sidebar */}
            {session?.user && (
              <div className={cn(
                "h-full transition-all duration-300 ease-in-out bg-background border-l border-border shrink-0",
                isNotesOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden border-none"
              )}>
                <div className="w-80 h-full">
                  <NotesSidebar
                    chatId={chat.id}
                    isOpen={isNotesOpen}
                    onClose={() => setIsNotesOpen(false)}
                    refreshKey={notesRefreshKey}
                  />
                </div>
              </div>
            )}
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
      {session?.user && (
        <MindMapDialog
          chatId={chat.id}
          isOpen={isMindMapOpen}
          onClose={() => {
            setIsMindMapOpen(false);
            // If user is on the chat tab on mobile, switch to file so the page-jump is visible
            setActiveMobileTab("file");
          }}
          fileName={chat.fileName}
        />
      )}
      <ClearChatModal
        isOpen={isClearChatOpen}
        onClose={() => setIsClearChatOpen(false)}
        chatName={chat.fileName}
        loading={isClearingChat}
        onConfirm={async () => {
          setIsClearingChat(true);
          try {
            await axios.post("/api/chats/clear", { chatId: chat.id });
            window.dispatchEvent(new CustomEvent("clear-chat", { detail: { chatId: chat.id } }));
            toast.success("Chat cleared!");
            setIsClearChatOpen(false);
          } catch {
            toast.error("Failed to clear chat");
          } finally {
            setIsClearingChat(false);
          }
        }}
      />
      <FloatingMenu onAction={handleSelectionAction} />
    </div>
  );
}

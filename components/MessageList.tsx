// UI REDESIGN
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { CiUser, CiRedo } from "react-icons/ci";
import { IoSparklesOutline, IoCopyOutline, IoCheckmarkOutline } from "react-icons/io5";
import { LuNotebook } from "react-icons/lu";
import { usePreferences } from "./providers/PreferencesContext";
import { saveToNotes } from "./NotesPanel";
import toast from "react-hot-toast";

type Props = {
  messages: UIMessage[];
  reload?: () => void;
  status?: string;
  chatId?: string;
  onNoteAdded?: () => void;
  isSharedView?: boolean;
};

type RowProps = {
  message: UIMessage;
  text: string;
  isUser: boolean;
  senderName?: string;
  chatAppearance: string;
  chatId?: string;
  isSharedView: boolean;
  canRegenerate: boolean;
  onNoteAdded: () => void;
  onRegenerate: () => void;
};

const MessageRow = React.memo(function MessageRow({
  text,
  isUser,
  senderName,
  chatId,
  isSharedView,
  canRegenerate,
  onNoteAdded,
  onRegenerate,
}: RowProps) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div
      className={cn("group/msg flex w-full animate-in fade-in duration-300 py-5 border-b border-border/40 last:border-0", {
        "bg-muted/40": !isUser,
      })}>
      <div className="flex gap-4 max-w-4xl mx-auto w-full px-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center select-none shadow-sm",
            isUser
              ? "bg-card border border-border text-foreground"
              : "bg-primary text-primary-foreground",
          )}>
          {isUser ? <CiUser className="h-4.5 w-4.5" /> : <IoSparklesOutline className="h-4 w-4" />}
        </div>

        <div className="flex flex-col gap-1 w-full min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-bold tracking-wide", isUser ? "text-foreground" : "text-primary")}>
              {isUser ? (senderName || "YOU") : "AI"}
            </span>
          </div>
          
          {/* Message Content */}
          <div className="text-[15px] leading-relaxed tracking-normal text-foreground markdown-prose whitespace-pre-wrap mt-1">
            {text}
          </div>

          {/* Message Actions */}
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
            {!isUser && (
              <button
                title="Copy message"
                onClick={() => {
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  toast.success("Copied to clipboard");
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                {copied ? <IoCheckmarkOutline className="w-3.5 h-3.5 text-foreground" /> : <IoCopyOutline className="w-3.5 h-3.5" />}
              </button>
            )}
            {!isSharedView && chatId && (
              <button
                title="Save to Notes"
                onClick={async () => {
                  try {
                    await saveToNotes(chatId, text, isUser ? "user_message" : "ai_response");
                    toast.success("Saved to notes");
                    onNoteAdded();
                  } catch {
                    toast.error("Failed to save note");
                  }
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <LuNotebook className="w-3.5 h-3.5" />
              </button>
            )}
            {!isSharedView && !isUser && canRegenerate && (
              <button
                title="Regenerate response"
                onClick={onRegenerate}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <CiRedo className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageList = ({ messages, reload, status, chatId, onNoteAdded, isSharedView = false }: Props) => {
  const { chatAppearance } = usePreferences();

  // Keep stable callback identities so memoized rows aren't invalidated every
  // time the parent re-renders (which happens on every streamed token).
  const onNoteAddedRef = React.useRef(onNoteAdded);
  onNoteAddedRef.current = onNoteAdded;
  const reloadRef = React.useRef(reload);
  reloadRef.current = reload;

  const stableNoteAdded = React.useCallback(() => onNoteAddedRef.current?.(), []);
  const stableReload = React.useCallback(() => reloadRef.current?.(), []);

  if (!messages?.length) return null;

  const lastId = messages[messages.length - 1].id;

  return (
    <div className="flex flex-col w-full">
      {messages.map((message) => {
        const text = message.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("") ?? "";

        const isUser = message.role === "user";
        // @ts-expect-error Vercel AI SDK does not include senderName in UIMessage type yet
        const senderName = message.senderName as string | undefined;
        const canRegenerate = !!reload && status !== "streaming" && message.id === lastId;

        return (
          <MessageRow
            key={message.id}
            message={message}
            text={text}
            isUser={isUser}
            senderName={senderName}
            chatAppearance={chatAppearance}
            chatId={chatId}
            isSharedView={isSharedView}
            canRegenerate={canRegenerate}
            onNoteAdded={stableNoteAdded}
            onRegenerate={stableReload}
          />
        );
      })}
    </div>
  );
};

export default MessageList;

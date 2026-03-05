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

const MessageList = ({ messages, reload, status, chatId, onNoteAdded, isSharedView = false }: Props) => {
  const { chatAppearance } = usePreferences();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!messages?.length) return null;

  return (
    <div className="flex flex-col gap-4 px-2 sm:px-4 py-4 group">
      {messages.map((message) => {
        const text = message.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");

        const isUser = message.role === "user";
        // @ts-ignore - senderName is added by our backend
        const senderName = message.senderName;

        return (
          <div
            key={message.id}
            className={cn("flex flex-col w-full animate-in fade-in slide-in-from-bottom-2 duration-300", {
              "items-end": isUser,
              "items-start": !isUser,
            })}>
            {isUser && senderName && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 mr-11">
                {senderName}
              </span>
            )}
            <div
              className={cn("flex gap-3 max-w-[85%] lg:max-w-[75%]", {
                "flex-row-reverse": isUser,
                "flex-row": !isUser,
              })}>
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm select-none mt-1",
                  isUser
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                    : "bg-muted border border-border text-muted-foreground",
                )}>
                {isUser ? <CiUser className="h-4 w-4" /> : <IoSparklesOutline className="h-4 w-4" />}
              </div>

              <div className="flex flex-col gap-1 w-full">
                {/* Message Bubble */}
                <div
                  className={cn("px-5 py-2.5 shadow-sm text-[15px] leading-relaxed tracking-wide", {
                    // Modern
                    "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-md": chatAppearance === "modern" && isUser,
                    "bg-card text-foreground border border-border rounded-2xl rounded-tl-sm w-fit": chatAppearance === "modern" && !isUser,
                    // Classic
                    "bg-primary/10 text-foreground border border-primary/20 rounded-md w-fit": chatAppearance === "classic" && isUser,
                    "bg-muted text-foreground border border-border rounded-md w-fit": chatAppearance === "classic" && !isUser,
                  })}>
                  <div className="markdown-prose whitespace-pre-wrap font-medium text-sm sm:text-base leading-relaxed">{text}</div>
                </div>
                
                {/* Message Actions */}
                <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {!isUser && (
                    <button
                      title="Copy message"
                      onClick={() => {
                        navigator.clipboard.writeText(text);
                        setCopiedId(message.id);
                        toast.success("Copied to clipboard");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                    >
                      {copiedId === message.id ? <IoCheckmarkOutline className="w-3.5 h-3.5 text-primary" /> : <IoCopyOutline className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {!isSharedView && chatId && (
                    <button
                      title="Save to Notes"
                      onClick={async () => {
                        try {
                          await saveToNotes(chatId, text, isUser ? "user_message" : "ai_response");
                          toast.success("Saved to notes");
                          if (onNoteAdded) onNoteAdded();
                        } catch {
                          toast.error("Failed to save note");
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-muted transition-colors"
                    >
                      <LuNotebook className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isSharedView && !isUser && reload && status !== "streaming" && message.id === messages[messages.length - 1].id && (
                    <button
                      title="Regenerate response"
                      onClick={() => reload()}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                    >
                       <CiRedo className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;

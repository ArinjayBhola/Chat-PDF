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

const MessageList = ({ messages, reload, status, chatId, onNoteAdded, isSharedView = false }: Props) => {
  const { chatAppearance } = usePreferences();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!messages?.length) return null;

  return (
    <div className="flex flex-col gap-5 px-2 sm:px-4 py-4">
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
            className={cn("group/msg flex flex-col w-full animate-in fade-in slide-in-from-bottom-2 duration-300", {
              "items-end": isUser,
              "items-start": !isUser,
            })}>
            {isUser && senderName && (
              <span className="text-[10px] font-bold text-muted-foreground mb-1 mr-11 uppercase tracking-wider">
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
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-xs select-none mt-1 transition-transform duration-200 group-hover/msg:scale-105",
                  isUser
                    ? "bg-primary text-primary-foreground border border-transparent"
                    : "bg-muted border border-border text-muted-foreground",
                )}>
                {isUser ? <CiUser className="h-4.5 w-4.5" /> : <IoSparklesOutline className="h-4 w-4" />}
              </div>

              <div className="flex flex-col gap-1 w-full">
                {/* Message Bubble */}
                <div
                  className={cn("px-4.5 py-3 shadow-xs text-sm sm:text-[15px] leading-relaxed tracking-normal transition-shadow duration-200 group-hover/msg:shadow-sm", {
                    // Modern
                    "bg-primary text-primary-foreground rounded-lg rounded-tr-none shadow-xs": chatAppearance === "modern" && isUser,
                    "bg-card text-foreground border border-border rounded-lg rounded-tl-none w-fit": chatAppearance === "modern" && !isUser,
                    // Classic
                    "bg-primary/10 text-foreground border border-primary/20 rounded-lg w-fit": chatAppearance === "classic" && isUser,
                    "bg-muted text-foreground border border-border rounded-lg w-fit": chatAppearance === "classic" && !isUser,
                  })}>
                  <div className="markdown-prose whitespace-pre-wrap font-medium leading-relaxed">{text}</div>
                </div>

                {/* Message Actions */}
                <div className="flex items-center gap-1 mt-1 px-1 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 translate-y-1 group-hover/msg:translate-y-0">
                  {!isUser && (
                    <button
                      title="Copy message"
                      onClick={() => {
                        navigator.clipboard.writeText(text);
                        setCopiedId(message.id);
                        toast.success("Copied to clipboard");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all duration-150 active:scale-95 cursor-pointer"
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
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      <LuNotebook className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isSharedView && !isUser && reload && status !== "streaming" && message.id === messages[messages.length - 1].id && (
                    <button
                      title="Regenerate response"
                      onClick={() => reload()}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all duration-150 active:scale-95 cursor-pointer"
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

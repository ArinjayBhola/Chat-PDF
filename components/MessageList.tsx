import React from "react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { CiUser } from "react-icons/ci";
import { IoSparklesOutline } from "react-icons/io5";

type Props = {
  messages: UIMessage[];
};

const MessageList = ({ messages }: Props) => {
  if (!messages?.length) return null;

  return (
    <div className="flex flex-col gap-4 px-2 sm:px-4 py-4">
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

              {/* Message Bubble */}
              <div
                className={cn("rounded-2xl px-5 py-2.5 shadow-sm text-[15px] leading-relaxed tracking-wide", {
                  "bg-primary text-primary-foreground rounded-tr-sm shadow-md": isUser,
                  "bg-card text-foreground border border-border rounded-tl-sm":
                    !isUser,
                })}>
                <div className="markdown-prose whitespace-pre-wrap font-medium">{text}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;

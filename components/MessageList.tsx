import React from "react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { CiUser } from "react-icons/ci";
import { IoSparklesOutline } from "react-icons/io5";

type Props = {
  messages: UIMessage[];
};

const MessageList = ({ messages }: Props) => {
  if (!messages?.length)
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full text-center text-slate-500 dark:text-slate-400 p-8">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm">
          <IoSparklesOutline className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">No messages yet</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Start the conversation by asking a question about your PDF.
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-4 px-2 sm:px-4 py-4">
      {messages.map((message) => {
        const text = message.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");

        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", {
              "justify-end": isUser,
              "justify-start": !isUser,
            })}>
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
                    ? "bg-blue-600 dark:bg-blue-500 text-white ring-2 ring-blue-100 dark:ring-blue-900/50"
                    : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
                )}>
                {isUser ? <CiUser className="h-4 w-4" /> : <IoSparklesOutline className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={cn("rounded-2xl px-5 py-2.5 shadow-sm text-[15px] leading-relaxed tracking-wide", {
                  "bg-blue-600 dark:bg-blue-500 text-white rounded-tr-sm shadow-md": isUser,
                  "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm":
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

import React from "react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { User, Sparkles } from "lucide-react";

type Props = {
  messages: UIMessage[];
};

const MessageList = ({ messages }: Props) => {
  if (!messages?.length) 
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full text-center text-slate-400 p-8">
        <div className="bg-slate-100 p-4 rounded-full">
            <Sparkles className="h-8 w-8 text-blue-400" />
        </div>
        <div>
            <p className="text-lg font-semibold text-slate-700">No messages yet</p>
            <p className="text-sm text-slate-500 mt-1">Start the conversation by asking a question about your PDF.</p>
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
            })}
          >
            <div
              className={cn("flex gap-3 max-w-[85%] lg:max-w-[75%]", {
                "flex-row-reverse": isUser,
                "flex-row": !isUser,
              })}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm select-none mt-1",
                  isUser 
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" 
                    : "bg-gradient-to-br from-purple-100 to-white border border-purple-200 text-purple-600"
                )}
              >
                {isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4 fill-purple-600/20" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn("rounded-2xl px-5 py-2.5 shadow-sm text-[15px] leading-relaxed tracking-wide", {
                  "bg-blue-600 text-white rounded-tr-sm": isUser,
                  "bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-md": !isUser,
                })}
              >
                <div className="markdown-prose whitespace-pre-wrap font-medium">
                    {text}
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

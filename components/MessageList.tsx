import React from "react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";

type Props = {
  messages: UIMessage[];
};

const MessageList = ({ messages }: Props) => {
  if (!messages?.length) return null;

  return (
    <div className="flex flex-col gap-2 px-4">
      {messages.map((message) => {
        const text = message.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");

        return (
          <div
            key={message.id}
            className={cn("flex", {
              "justify-end pl-10": message.role === "user",
              "justify-start pr-10": message.role === "assistant",
            })}>
            <div
              className={cn("rounded-lg px-3 py-3 shadow-md ring-1 ring-gray-900/10", {
                "bg-blue-600 text-white": message.role === "user",
                "bg-gray-100": message.role === "assistant",
              })}>
              <p className="whitespace-pre-wrap text-sm">{text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;

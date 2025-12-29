"use client";

import React, { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { dbMessageToUIMessage } from "@/lib/message-mapper";
import { cn } from "@/lib/utils";
import { FiLoader } from "react-icons/fi";
import { FaArrowUp } from "react-icons/fa";

type Props = {
  chatId: string;
};

export default function ChatComponent({ chatId }: Props) {
  const [input, setInput] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { data, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const res = await axios.post("/api/get-messages", { chatId });
      return res.data;
    },
    staleTime: 0,
  });

  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          chatId,
          messages,
        },
      }),
    }),
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]); // specific dependency on status to scroll when "thinking" starts

  // Sync initial messages
  useEffect(() => {
    if (data?.messages) {
      const uiMessages = data.messages.map(dbMessageToUIMessage);
      setMessages(uiMessages);
    }
  }, [data, setMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const isScanning = status === "submitted"; // Waiting for response
  const isStreaming = status === "streaming"; // Receiving response

  return (
    <div className="relative h-full flex flex-col bg-white">
      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth custom-scrollbar pb-32">
        <MessageList messages={messages} />

        {/* Loadbar / Thinking State */}
        {isScanning && (
          <div className="flex justify-start px-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3">
              <FiLoader className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-[15px] text-slate-700 font-medium">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Floating at bottom */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all hover:border-slate-300">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your PDF..."
              disabled={status !== "ready"}
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 px-4 py-4 h-auto"
            />

            <Button
              type="submit"
              disabled={!input.trim() || status !== "ready"}
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl transition-all duration-200 mr-1",
                status !== "ready"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95",
              )}>
              {isStreaming ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FaArrowUp className="h-5 w-5 stroke-[2.5px]" />
              )}
            </Button>
          </form>

          {/* Helper footer text */}
          <div className="text-center mt-3">
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              AI Generated content may be inaccurate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

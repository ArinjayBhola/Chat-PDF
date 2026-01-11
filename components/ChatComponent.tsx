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
import { FiLoader, FiGlobe } from "react-icons/fi";
import { FaArrowUp } from "react-icons/fa";

type Props = {
  chatId: string;
};

export default function ChatComponent({ chatId }: Props) {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
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
          webSearch,
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
    <div className="relative h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth custom-scrollbar">
        <MessageList messages={messages} />

        {/* Loadbar / Thinking State */}
        {isScanning && (
          <div className="flex justify-start px-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3">
              <FiLoader className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-[15px] text-slate-700 dark:text-slate-300 font-medium">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Pinned at bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        <div className="max-w-4xl mx-auto w-full">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-blue-400/20 focus-within:border-blue-500/50 dark:focus-within:border-blue-400/50 transition-all hover:border-slate-300 dark:hover:border-slate-600">
            
            <button
              type="button"
              onClick={() => setWebSearch(!webSearch)}
              className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 ${
                webSearch
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
              title="Web Search"
            >
              <FiGlobe className="h-5 w-5" />
            </button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your PDF..."
              disabled={status !== "ready"}
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-[15px] font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 h-auto min-h-0"
            />

            <Button
              type="submit"
              disabled={!input.trim() || status !== "ready"}
              size="icon"
              className={cn(
                "h-10 w-10 flex-shrink-0 rounded-xl transition-all duration-200",
                status !== "ready"
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95",
              )}>
              {isStreaming ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FaArrowUp className="h-5 w-5 stroke-[2.5px]" />
              )}
            </Button>
          </form>

          {/* Helper footer text */}
          <div className="text-center mt-2">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              AI Generated content may be inaccurate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

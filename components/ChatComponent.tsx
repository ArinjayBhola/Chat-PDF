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
import { FiGlobe } from "react-icons/fi";
import { FaArrowUp } from "react-icons/fa";
import { LuLoaderCircle } from "react-icons/lu";
import { IoSparklesOutline } from "react-icons/io5";

type Props = {
  chatId: string;
  isOwner?: boolean;
  isShared?: boolean;
  sharePermission?: "view" | "edit";
};

export default function ChatComponent({
  chatId,
  isOwner,
  isShared,
  sharePermission,
}: Props) {
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/session");
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const canChat = isOwner || (isShared && sharePermission === "edit" && sessionData?.user);
  const showLoginPrompt = isShared && !sessionData?.user && sharePermission === "edit";

  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  /* Load messages */
  const { data } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const res = await axios.post("/api/get-messages", { chatId });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages, ...data }) => ({
        body: {
          chatId,
          messages,
          ...data,
        },
      }),
    }),
  });

  /* Auto scroll */
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  /* Sync DB messages */
  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages.map(dbMessageToUIMessage));
    }
  }, [data, setMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    
    // Clear input first
    const question = input;
    setInput("");

    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: question }],
      },
      {
        body: { webSearch },
      },
    );
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="relative h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        
        <div className="min-h-full flex flex-col justify-end">
          
          {/* Empty State - No Messages Yet */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-slate-500 dark:text-slate-400 p-8 mb-4">
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
          )}

          <MessageList messages={messages} />

          {status === "submitted" && (
             <div className="flex justify-start px-4 mt-4">
              <div className="max-w-[70%] rounded-2xl rounded-tl-none px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
                <span className="inline-block animate-spin">
                  <LuLoaderCircle />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto w-full space-y-2">
          {showLoginPrompt && (
            <div className="p-3 mb-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 flex items-center justify-between">
              <p className="text-xs text-orange-800 dark:text-orange-300">
                You need to sign in to send messages to this shared chat.
              </p>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.location.href = `/sign-in?callbackUrl=${window.location.pathname}`}>
                Sign In
              </Button>
            </div>
          )}
          {!canChat && !showLoginPrompt && isShared && (
             <div className="p-2 mb-2 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                <p className="text-xs text-blue-800 dark:text-blue-300 text-center uppercase tracking-wider font-semibold">
                  Read-Only Mode
                </p>
             </div>
          )}

          {/* Mode indicator */}
          {webSearch && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <FiGlobe className="h-4 w-4" />
              <span className="font-medium">Web search enabled - using live internet data</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all",
              isBusy && "opacity-90",
            )}>
            {/* Web search toggle */}
            <button
              type="button"
              onClick={() => setWebSearch((v) => !v)}
              disabled={isBusy}
              className={cn(
                "flex items-center gap-2 px-3 h-10 rounded-xl border text-sm font-medium transition-all",
                webSearch
                  ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500",
              )}>
              <FiGlobe className="h-4 w-4" />
              <span className="hidden sm:inline">{webSearch ? "Web Search ON" : "Web Search"}</span>
            </button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isBusy || !canChat}
              placeholder={!canChat ? "Chatting is disabled..." : (webSearch ? "Ask using live web data…" : "Ask a question about your PDF…")}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm"
            />

            {/* Send button morph */}
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim()}
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                isBusy ? "bg-blue-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
              )}>
              <FaArrowUp className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

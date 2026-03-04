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
    <div className="relative h-full flex flex-col bg-background overflow-hidden">
      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        
        <div className="min-h-full flex flex-col justify-end">
          
          {/* Empty State - No Messages Yet */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 mb-4 max-w-lg mx-auto">
              <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-sm animate-in zoom-in duration-500">
                <IoSparklesOutline className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  Start the conversation by asking a question, or switch on Web Search to browse the internet.
                </p>
              </div>
            </div>
          )}

          <MessageList messages={messages} />

          {status === "submitted" && (
             <div className="flex justify-start px-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-muted text-foreground text-sm font-medium shadow-sm">
                <span className="inline-block animate-spin text-primary">
                  <LuLoaderCircle className="w-5 h-5" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-md">
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
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-1.5 rounded-lg w-fit">
              <FiGlobe className="h-4 w-4" />
              <span className="font-medium animate-pulse">Web search active</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20",
              isBusy && "opacity-90",
            )}>
            {/* Web search toggle */}
            <button
              type="button"
              onClick={() => setWebSearch((v) => !v)}
              disabled={isBusy}
              title="Toggle Web Search"
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all flex-shrink-0",
                webSearch
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}>
              <FiGlobe className="h-4 w-4" />
            </button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isBusy || !canChat}
              placeholder={!canChat ? "Chatting is disabled..." : (webSearch ? "Ask using live web data…" : "Ask a question about your document…")}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm md:text-base px-2 shadow-none"
            />

            {/* Send button morph */}
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim()}
              className={cn(
                "h-10 w-10 rounded-xl transition-all flex-shrink-0",
                "bg-primary hover:bg-primary/90 text-primary-foreground",
              )}>
              <FaArrowUp className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

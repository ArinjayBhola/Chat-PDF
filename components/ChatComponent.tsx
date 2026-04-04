"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import MessageList from "./MessageList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { dbMessageToUIMessage } from "@/lib/message-mapper";
import { cn } from "@/lib/utils";
import { FiGlobe } from "react-icons/fi";
import { FaArrowUp } from "react-icons/fa";
import { LuLoaderCircle, LuArrowUp, LuArrowDown, LuChevronsDown } from "react-icons/lu";
import { IoSparklesOutline } from "react-icons/io5";

type Props = {
  chatId: string;
  isOwner?: boolean;
  isShared?: boolean;
  sharePermission?: "view" | "edit";
  onNoteAdded?: () => void;
  isSharedView?: boolean;
};

export default function ChatComponent({
  chatId,
  isOwner,
  isShared,
  sharePermission,
  onNoteAdded,
  isSharedView = false,
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

  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll navigation state
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromTop = scrollTop;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setShowScrollTop(distanceFromTop > 300);
    setShowScrollBottom(distanceFromBottom > 150);
    setIsAutoScrollEnabled(distanceFromBottom <= 150);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setIsAutoScrollEnabled(true);
  };

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

  /* Auto scroll - only when user hasn't scrolled up */
  useEffect(() => {
    if (!containerRef.current || !isAutoScrollEnabled) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status, isAutoScrollEnabled]);

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
    // Invalidate cache so other ChatComponent instances get fresh messages
    queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || status !== "ready") return;
    // The last message is the AI's response, the one before is the user's prompt
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage.role !== "user") return;

    // Remove the last AI response
    setMessages(messages.slice(0, -1));

    // Extract text from the custom parts structure used in this project
    const previousQuestion = lastUserMessage.parts
      ?.filter((part) => part.type === "text")
      // @ts-ignore
      .map((part) => part.text)
      .join("") || "";

    if (!previousQuestion) return;

    // Resend the last user prompt manually
    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: previousQuestion }],
      },
      {
        body: { webSearch },
      }
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

          <MessageList 
            messages={messages} 
            reload={handleRegenerate} 
            status={status} 
            chatId={chatId} 
            onNoteAdded={onNoteAdded} 
            isSharedView={isSharedView}
          />

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

      {/* Scroll Navigation Buttons */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col gap-2">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-2 rounded-full bg-background/90 border border-border shadow-lg backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 animate-in fade-in zoom-in-75 active:scale-90"
            title="Scroll to top"
          >
            <LuArrowUp className="w-4 h-4" />
          </button>
        )}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 animate-in fade-in zoom-in-75 active:scale-90"
            title="Scroll to bottom"
          >
            <LuChevronsDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto w-full space-y-2">
          {showLoginPrompt && (
            <div className="p-3 mb-2 rounded-xl bg-accent/50 border border-border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs text-muted-foreground font-medium">
                Sign in to send messages to this shared chat.
              </p>
              <Button size="sm" variant="outline" className="h-7 text-xs ml-3 shrink-0" onClick={() => window.location.href = `/sign-in?callbackUrl=${window.location.pathname}`}>
                Sign In
              </Button>
            </div>
          )}
          {!canChat && !showLoginPrompt && isShared && (
             <div className="p-2.5 mb-2 rounded-xl bg-muted/50 border border-border animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground text-center uppercase tracking-wider font-semibold">
                  Read-Only Mode
                </p>
             </div>
          )}

          {/* Mode indicator */}
          {webSearch && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl w-fit animate-in fade-in slide-in-from-bottom-1 duration-200">
              <FiGlobe className="h-3.5 w-3.5" />
              <span className="font-semibold">Web search active</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 focus-within:shadow-md",
              isBusy && "opacity-90",
            )}>
            {/* Web search toggle */}
            <button
              type="button"
              onClick={() => setWebSearch((v) => !v)}
              disabled={isBusy}
              title="Toggle Web Search"
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-95",
                webSearch
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim()}
              className={cn(
                "h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0 active:scale-90",
                input.trim()
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg"
                  : "bg-muted text-muted-foreground",
              )}>
              <FaArrowUp className={cn("h-4 w-4 transition-transform duration-200", input.trim() && "scale-110")} />
            </Button>
          </form>

          {/* Keyboard hint */}
          {canChat && (
            <p className="text-[10px] text-muted-foreground/60 text-center font-medium select-none">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">Enter</kbd> to send
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { useSession } from "next-auth/react";
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
import { LuLoaderCircle, LuArrowUp, LuChevronsDown } from "react-icons/lu";
import { IoSparklesOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

type Props = {
  chatId: string;
  isOwner?: boolean;
  isShared?: boolean;
  sharePermission?: "view" | "edit";
  onNoteAdded?: () => void;
  isSharedView?: boolean;
  pdfStatus?: string;
};

export default function ChatComponent({
  chatId,
  isOwner,
  isShared,
  sharePermission,
  onNoteAdded,
  isSharedView = false,
  pdfStatus = "SUCCESS",
}: Props) {
  // Session is already hydrated by the root SessionProvider, so read it from
  // context instead of issuing a separate /api/auth/session request per chat.
  const { data: sessionData } = useSession();

  const canChat = isOwner || (isShared && sharePermission === "edit" && sessionData?.user);
  const showLoginPrompt = isShared && !sessionData?.user && sharePermission === "edit";

  const queryClient = useQueryClient();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Poll for status update if it's processing
  useEffect(() => {
    if (pdfStatus === "PROCESSING") {
      const interval = setInterval(() => {
        router.refresh(); // This will re-fetch Server Components and update pdfStatus
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [pdfStatus, router]);

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

  /* Listen for clear chat event */
  useEffect(() => {
    const handleClearChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.chatId === chatId) {
        setMessages([]);
      }
    };
    window.addEventListener("clear-chat", handleClearChat);
    return () => window.removeEventListener("clear-chat", handleClearChat);
  }, [chatId, setMessages]);

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

  /* Handle Selection Actions from Floating Menu */
  useEffect(() => {
    const handleSelectionAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { action, text, targetChatId } = customEvent.detail;
      if (targetChatId && targetChatId !== chatId) return;

      let prompt = "";
      switch (action) {
        case "explain":
          prompt = `Explain this part of the document in detail:\n\n"${text}"`;
          break;
        case "summarize":
          prompt = `Summarize this specific section concisely:\n\n"${text}"`;
          break;
        case "translate":
          prompt = `Translate this text into plain English (or the primary language of our conversation if different):\n\n"${text}"`;
          break;
        default:
          return;
      }

      setInput(prompt);
      // We can't easily trigger the form submit here without refactoring, 
      // but setting the input is a great first step. 
      // Actually, let's try to trigger it if possible.
      setTimeout(() => {
        const form = document.querySelector("#chat-form") as HTMLFormElement;
        if (form) {
            form.requestSubmit();
        }
      }, 100);
    };

    window.addEventListener("selection-action", handleSelectionAction);
    return () => window.removeEventListener("selection-action", handleSelectionAction);
  }, [chatId]);

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
              <div className="bg-primary/10 p-4.5 rounded-lg border border-primary/20 shadow-xs animate-in zoom-in duration-500">
                <IoSparklesOutline className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-2 font-semibold max-w-sm leading-relaxed">
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
             <div className="flex justify-start px-4 mt-4 animate-in fade-in slide-in-from-bottom-2 w-full max-w-[60%]">
              <div className="rounded-lg rounded-tl-none px-5 py-4 bg-muted text-foreground text-sm font-medium shadow-xs w-full border border-border/50">
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-5/6" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-3/4" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-1/2" />
                </div>
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
            className="p-2.5 rounded-full bg-background border border-border shadow-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 animate-in fade-in zoom-in-75 active:scale-90 cursor-pointer"
            title="Scroll to top"
          >
            <LuArrowUp className="w-4 h-4" />
          </button>
        )}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="p-2.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/95 transition-all duration-200 animate-in fade-in zoom-in-75 active:scale-90 cursor-pointer"
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
            <div className="p-3 mb-2 rounded-lg bg-muted border border-border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs text-muted-foreground font-semibold">
                Sign in to send messages to this shared chat.
              </p>
              <Button size="sm" variant="outline" className="h-7 text-xs ml-3 shrink-0" onClick={() => window.location.href = `/sign-in?callbackUrl=${window.location.pathname}`}>
                Sign In
              </Button>
            </div>
          )}
          {!canChat && !showLoginPrompt && isShared && (
             <div className="p-2.5 mb-2 rounded-lg bg-muted/50 border border-border animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground text-center uppercase tracking-wider font-bold">
                  Read-Only Mode
                </p>
             </div>
          )}

          {pdfStatus === "PROCESSING" && (
             <div className="p-3 mb-2 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center animate-pulse gap-2">
                <LuLoaderCircle className="w-5 h-5 text-primary animate-spin" />
                <p className="text-xs text-primary font-bold uppercase tracking-wider">
                  Processing Document...
                </p>
                <p className="text-[10px] text-primary/70 text-center font-medium">
                  We are extracting and indexing the text. You can chat once it&apos;s done. Please refresh the page in a few moments.
                </p>
             </div>
          )}

          {/* Mode indicator */}
          {webSearch && (
            <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md w-fit animate-in fade-in slide-in-from-bottom-1 duration-200 font-bold uppercase tracking-wider">
              <FiGlobe className="h-3.5 w-3.5" />
              <span>Web search active</span>
            </div>
          )}

          <form
            id="chat-form"
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-background p-2 rounded-xl border border-border shadow-sm transition-all duration-200 focus-within:ring-1 focus-within:ring-foreground/20 focus-within:border-foreground/30",
              isBusy && "opacity-90",
            )}>
            {/* Web search toggle */}
            <button
              type="button"
              onClick={() => setWebSearch((v) => !v)}
              disabled={isBusy || pdfStatus === "PROCESSING"}
              title="Toggle Web Search"
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 flex-shrink-0 cursor-pointer ml-1",
                webSearch
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}>
              <FiGlobe className="h-4 w-4" />
            </button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isBusy || !canChat || pdfStatus === "PROCESSING"}
              placeholder={!canChat ? "Chatting is disabled..." : (pdfStatus === "PROCESSING" ? "Document is processing..." : (webSearch ? "Ask using live web data…" : "Ask a question about your document…"))}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-[15px] px-2 shadow-none focus-visible:border-none focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            />

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim() || pdfStatus === "PROCESSING"}
              className={cn(
                "h-8 w-8 rounded-lg transition-all duration-200 flex-shrink-0 mr-1",
                input.trim()
                  ? "bg-foreground hover:bg-foreground/90 text-background shadow-sm"
                  : "bg-muted text-muted-foreground opacity-50",
              )}>
              <FaArrowUp className={cn("h-3.5 w-3.5 transition-transform duration-200", input.trim() && "scale-110")} />
            </Button>
          </form>

          {/* Keyboard hint */}
          {canChat && pdfStatus !== "PROCESSING" && (
            <p className="text-[10px] text-muted-foreground/60 text-center font-semibold select-none">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">Enter</kbd> to send
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

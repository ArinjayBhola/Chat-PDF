// UI REDESIGN
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { FaArrowUp } from "react-icons/fa";
import { LuLoaderCircle, LuGitCompareArrows, LuFileBox, LuX, LuPlus } from "react-icons/lu";
import { IoSparklesOutline } from "react-icons/io5";
import { CiUser } from "react-icons/ci";
import { IoCopyOutline, IoCheckmarkOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { usePreferences } from "./providers/PreferencesContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { DrizzleChat } from "@/lib/db/schema";

type DocInfo = {
  id: string;
  fileName: string;
};

type Props = {
  chatIds: string[];
  documents: DocInfo[];
  allChats: DrizzleChat[];
};

export default function CompareView({ chatIds, documents, allChats }: Props) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const hasTriggered = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { chatAppearance } = usePreferences();
  const router = useRouter();
  const queryClient = useQueryClient();

  const canRemove = documents.length > 2;
  const canAdd = documents.length < 3;
  const availableToAdd = allChats.filter((c) => !chatIds.includes(c.id));

  const handleRemoveDoc = (docId: string) => {
    if (!canRemove) return;
    const newIds = chatIds.filter((id) => id !== docId);
    router.push(`/compare?chats=${newIds.join(",")}`);
  };

  const handleAddDoc = (docId: string) => {
    if (!canAdd) return;
    const newIds = [...chatIds, docId];
    router.push(`/compare?chats=${newIds.join(",")}`);
    setShowAddMenu(false);
  };

  // Check for existing comparison
  const { data: existingData, isLoading: checkingExisting } = useQuery({
    queryKey: ["comparison", ...chatIds],
    queryFn: async () => {
      const res = await axios.get(`/api/compare?chatIds=${chatIds.join(",")}`);
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/compare",
        prepareSendMessagesRequest: ({ messages, ...data }) => ({
          body: {
            chatIds,
            comparisonId,
            messages,
            ...data,
          },
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatIds.join(","), comparisonId],
  );

  const { messages, setMessages, sendMessage, status } = useChat({ transport });

  // Load saved messages if comparison exists
  useEffect(() => {
    if (!existingData) return;

    if (existingData.exists && existingData.messages?.length > 0) {
      setComparisonId(existingData.comparisonId);
      const saved = existingData.messages.map((m: any) => ({
        id: m.id,
        role: m.role === "system" ? "assistant" : m.role,
        parts: [{ type: "text" as const, text: m.content }],
      }));
      setMessages(saved);
      hasTriggered.current = true;
    }
  }, [existingData, setMessages]);

  // Auto-trigger comparison only if no saved data
  useEffect(() => {
    if (checkingExisting) return;
    if (hasTriggered.current) return;
    if (existingData?.exists) return;

    hasTriggered.current = true;
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: "Compare these documents" }],
    });
  }, [checkingExisting, existingData, sendMessage]);

  // Save comparisonId from first AI response headers/creation
  useEffect(() => {
    if (!existingData?.exists && !comparisonId && status === "ready" && messages.length > 0) {
      // Refetch to get the comparisonId that was created
      axios.get(`/api/compare?chatIds=${chatIds.join(",")}`).then((res) => {
        if (res.data.exists) {
          setComparisonId(res.data.comparisonId);
          queryClient.invalidateQueries({ queryKey: ["comparisons-list"] });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Auto scroll
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;

    const question = input;
    setInput("");

    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: question }],
    });
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="relative h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/80 backdrop-blur-md flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <LuGitCompareArrows className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-[13px] sm:text-[14px] font-bold text-foreground truncate tracking-tight leading-tight">
              Document Comparison
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {documents.length} Documents
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document pills */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap relative">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-foreground/80 shadow-sm group/pill transition-all duration-200 hover:border-primary/30"
          >
            <LuFileBox className="w-3.5 h-3.5 text-primary" />
            <span className="truncate max-w-[150px]">{doc.fileName}</span>
            {canRemove && (
              <button
                onClick={() => handleRemoveDoc(doc.id)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 opacity-0 group-hover/pill:opacity-100"
                title="Remove from comparison"
              >
                <LuX className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {canAdd && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-200"
            >
              <LuPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 w-56 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg py-1 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                  {availableToAdd.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground italic">No more documents available</p>
                  ) : (
                    availableToAdd.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleAddDoc(chat.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left hover:bg-muted transition-colors"
                      >
                        <LuFileBox className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{chat.fileName}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        <div className="min-h-full flex flex-col justify-end">
          {checkingExisting && (
             <div className="flex justify-start px-4 mt-4 animate-in fade-in slide-in-from-bottom-2 w-full max-w-[60%] mr-auto">
              <div className="rounded-lg rounded-tl-none px-5 py-4 bg-muted text-foreground text-sm font-medium shadow-xs w-full border border-border/50">
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-5/6" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-3/4" />
                  <div className="h-2 bg-muted-foreground/20 rounded-full w-1/2" />
                </div>
              </div>
            </div>
          )}

          {!checkingExisting && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 mb-4 max-w-lg mx-auto">
              <div className="bg-primary/10 p-5 rounded-2xl border border-primary/15 shadow-xs animate-in zoom-in duration-500">
                <LuGitCompareArrows className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Analyzing Documents...</p>
                <p className="text-xs text-muted-foreground mt-2 font-semibold max-w-xs leading-relaxed">
                  Comparing your selected documents for differences, contradictions, and common ground.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 px-2 sm:px-4 py-4 group">
            {messages.map((message) => {
              const text = message.parts
                ?.filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("");

              const isUser = message.role === "user";

              // Hide the initial auto-trigger message
              if (isUser && text === "Compare these documents") return null;

              return (
                <div
                  key={message.id}
                  className={cn("flex flex-col w-full animate-in fade-in slide-in-from-bottom-2 duration-300", {
                    "items-end": isUser,
                    "items-start": !isUser,
                  })}>
                  <div
                    className={cn("flex gap-3 max-w-[85%] lg:max-w-[75%]", {
                      "flex-row-reverse": isUser,
                      "flex-row": !isUser,
                    })}>
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-xs select-none mt-1",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-border text-muted-foreground",
                      )}>
                      {isUser ? <CiUser className="h-4.5 w-4.5" /> : <IoSparklesOutline className="h-4 w-4" />}
                    </div>

                    <div className="flex flex-col gap-1 w-full">
                      <div
                        className={cn("px-4.5 py-3 shadow-xs text-sm sm:text-[15px] leading-relaxed tracking-normal", {
                          "bg-primary text-primary-foreground rounded-lg rounded-tr-none shadow-xs":
                            chatAppearance === "modern" && isUser,
                          "bg-card text-foreground border border-border rounded-lg rounded-tl-none w-fit":
                            chatAppearance === "modern" && !isUser,
                          "bg-primary/10 text-foreground border border-primary/20 rounded-lg w-fit":
                            chatAppearance === "classic" && isUser,
                          "bg-muted text-foreground border border-border rounded-lg w-fit":
                            chatAppearance === "classic" && !isUser,
                        })}>
                        <div className="markdown-prose whitespace-pre-wrap font-medium leading-relaxed">
                          {text}
                        </div>
                      </div>

                      {!isUser && (
                        <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            title="Copy message"
                            onClick={() => {
                              navigator.clipboard.writeText(text);
                              setCopiedId(message.id);
                              toast.success("Copied to clipboard");
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer">
                            {copiedId === message.id ? (
                              <IoCheckmarkOutline className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <IoCopyOutline className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {status === "submitted" && (
            <div className="flex justify-start px-4 mt-4 animate-in fade-in slide-in-from-bottom-2 w-full max-w-[60%] mr-auto">
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

      {/* Follow-up Input */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto w-full space-y-2">
          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-primary/50",
              isBusy && "opacity-90",
            )}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isBusy}
              placeholder="Ask a follow-up question about the comparison..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm md:text-base px-3 shadow-none"
            />

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

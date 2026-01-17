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
import { LuLoaderCircle } from "react-icons/lu";
import { IoSparklesOutline } from "react-icons/io5";

type Props = {
  chatId: string;
  summary?: string;
  suggestedQuestions?: string[];
};

export default function ChatComponent({ chatId, summary, suggestedQuestions }: Props) {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(true);

  /* Load messages */
  const { data } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const res = await axios.post("/api/get-messages", { chatId });
      return res.data;
    },
    staleTime: 0,
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
  }, [messages, status, showSummary]);

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

  const handleQuestionClick = async (question: string) => {
    setInput(""); // Clear input in case something was typed
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

          {/* Summary Section */}
          {summary && (
            <div className="mb-6 mx-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
              <div 
                 className="flex justify-between items-center cursor-pointer mb-2"
                 onClick={() => setShowSummary(!showSummary)}
              >
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Document Summary
                </h3>
                <span className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showSummary ? "Hide" : "Show"}
                </span>
              </div>
              {showSummary && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {summary}
                </p>
              )}
            </div>
          )}

          {/* Empty State with Suggested Questions */}
          {messages.length === 0 && suggestedQuestions && suggestedQuestions.length > 0 && (
            <div className="mx-2 mb-8">
              <p className="text-sm text-slate-500 mb-3 font-medium">Suggested Questions:</p>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuestionClick(q)}
                    disabled={isBusy}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-sm text-slate-700 dark:text-slate-300 group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      {q}
                    </span>
                  </button>
                ))}
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
              disabled={isBusy}
              placeholder={webSearch ? "Ask using live web data…" : "Ask a question about your PDF…"}
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

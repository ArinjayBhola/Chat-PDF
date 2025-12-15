"use client";

import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";

export default function ChatComponent() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat();

  const isLoading = status !== "ready";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  return (
    <div className="relative h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 p-3 border-b">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t p-3 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask any question…"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {error && <p className="text-red-500 text-sm px-3 py-1">{error.message}</p>}
    </div>
  );
}

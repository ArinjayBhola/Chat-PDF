"use client";

import React, { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { dbMessageToUIMessage } from "@/lib/message-mapper";

type Props = {
  chatId: string;
};

export default function ChatComponent({ chatId }: Props) {
  const [input, setInput] = useState("");

  const { data, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const res = await axios.post("/api/get-messages", { chatId });
      return res.data;
    },
    staleTime: 0,
  });

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          chatId,
          messages,
        },
      }),
    }),
  });

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data, setMessages]);

  useEffect(() => {
    const container = document.getElementById("message-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const isStreaming = status !== "ready";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isStreaming) return;

    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });

    setInput("");
  };

  useEffect(() => {
    if (data?.messages) {
      const uiMessages = data.messages.map(dbMessageToUIMessage);
      setMessages(uiMessages);
    }
  }, [data, setMessages]);

  return (
    <div className="relative h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 p-3 border-b">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* Messages */}
      <div
        id="message-container"
        className="flex-1 overflow-y-auto px-2">
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
            placeholder="Ask anything…"
            disabled={isStreaming || isLoadingMessages}
          />
          <Button
            type="submit"
            disabled={isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && <p className="text-red-500 text-sm px-3 py-1">{error.message}</p>}
    </div>
  );
}

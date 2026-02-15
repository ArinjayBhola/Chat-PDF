import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, ModelMessage, smoothStream, UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Exa from "exa-js";

export const runtime = "nodejs";

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: Request) {
  const { messages, chatId, body } = await req.json();
  const { webSearch } = body;
  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length != 1) {
    return NextResponse.json({ error: "chat not found" }, { status: 404 });
  }
  const fileKey = _chats[0].fileKey;
  const lastMessage = messages[messages.length - 1];

  await db.insert(_messages).values({
    id: crypto.randomUUID(),
    chatsId: chatId,
    content: lastMessage.parts[0].text,
    createdAt: new Date(),
    role: "user",
  });

  let promptContent = "";

  if (webSearch) {
    const result = await exa.searchAndContents(lastMessage.parts[0].text, {
      type: "neural",
      useAutoprompt: true,
      numResults: 3,
      text: true,
    });

    const searchContext = result.results
      .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.text}`)
      .join("\n\n");

    promptContent = `You are a direct and concise AI assistant.
      Answer the user's question immediately without any conversational filler, greetings, or praise.
      Only provide the requested information using the search results.
      Always cite your sources if possible based on the provided URL links.

      START WEB SEARCH RESULTS
      ${searchContext}
      END WEB SEARCH RESULTS
      `;
  } else {
    const context = await getContext(lastMessage.parts[0].text.replace(/\n/g, " "), fileKey);

    promptContent = `You are a helpful and expert AI assistant.
      
      Your primary goal is to answer the user's questions using the provided CONTEXT BLOCK below.
      
      INSTRUCTIONS:
      1. Always check the CONTEXT BLOCK first for relevant information.
      2. If the answer is found in the context, prioritize that information.
      3. If the answer is NOT in the context, use your own extensive knowledge to provide a helpful and accurate response. 
      4. When starting a response based on your own knowledge (because it's not in the context), you can briefly mention that you're providing general information.
      5. Be direct and concise. Avoid conversational filler, greetings, or praise unless necessary for clarity.
      6. If asked to "build" or provide code for something mentioned in the file, use the internal details if available; otherwise, provide a high-quality general solution.

      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      `;
  }

  const prompt = {
    role: "system",
    content: promptContent,
  };

  const conversationMessages: UIMessage[] = messages.map((m: any) => {
    if (m.parts) return m;

    return {
      role: m.role,
      id: m.id,
      parts: [{ type: "text", text: m.content }],
    };
  });

  const result = streamText({
    model: google("gemini-2.5-flash-preview-09-2025"),
    messages: [prompt as ModelMessage, ...convertToModelMessages(conversationMessages)],
    experimental_transform: smoothStream(),
    async onFinish({ text }) {
      // save assistant message into db
      await db.insert(_messages).values({
        id: crypto.randomUUID(),
        chatsId: chatId,
        content: text,
        createdAt: new Date(),
        role: "system",
      });
    },
  });

  return result.toUIMessageStreamResponse();
}

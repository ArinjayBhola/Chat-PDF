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
  const { messages, chatId, webSearch } = await req.json();
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
    const searchContext = result.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.text}`).join("\n\n");
    
    promptContent = `You are a helpful and knowledgeable AI assistant.
      You have access to real-time information from the web.
      Use the following search results to answer the user's question comprehensively.
      If the search results are not sufficient, you may use your general knowledge to supplement the answer, but prioritize the provided results.
      Always cite your sources if possible based on the provided URL links.

      START WEB SEARCH RESULTS
      ${searchContext}
      END WEB SEARCH RESULTS
      `;
  } else {
    const context = await getContext(lastMessage.parts[0].text.replace(/\n/g, " "), fileKey);
    
    promptContent = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `;
  }

  const prompt = {
    role: "system",
    content: promptContent,
  };

  const userMessages: UIMessage[] = messages
    .filter((m: any) => m.role === "user")
    .map((m: any) => {
      if (m.parts) return m;

      return {
        role: "user",
        id: m.id,
        parts: [{ type: "text", text: m.content }],
      };
    });

  const result = streamText({
    model: google("gemini-2.5-flash-preview-09-2025"),
    messages: [prompt as ModelMessage, ...convertToModelMessages(userMessages)],
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

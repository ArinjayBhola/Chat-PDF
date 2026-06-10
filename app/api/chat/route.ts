import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { streamText, generateText, convertToModelMessages, smoothStream, UIMessage, createUIMessageStreamResponse } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Exa from "exa-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

const exa = new Exa(process.env.EXA_API_KEY as string);

// Cache Gemini availability across requests so we don't pay for a full "ping"
// round-trip before every message. We only re-probe once the cache goes stale.
const GEMINI_HEALTH_TTL_MS = 60_000;
let geminiHealthyUntil = 0;

async function isGeminiHealthy(): Promise<boolean> {
  if (Date.now() < geminiHealthyUntil) return true;
  try {
    await generateText({
      model: google("gemini-2.5-flash"),
      prompt: "ping",
      maxTokens: 1,
      maxRetries: 0,
    } as any);
    geminiHealthyUntil = Date.now() + GEMINI_HEALTH_TTL_MS;
    return true;
  } catch (e) {
    console.warn("[MODEL_STATS] Gemini health probe failed:", e instanceof Error ? e.message : e);
    geminiHealthyUntil = 0;
    return false;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { messages, chatId, body } = await req.json();
  const { webSearch } = body;
  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length != 1) {
    return NextResponse.json({ error: "chat not found" }, { status: 404 });
  }

  const chat = _chats[0];

  // Permission Check
  const isOwner = session?.user?.id === chat.userId;
  const isCollaborator = chat.isShared === "true" && chat.sharePermission === "edit" && !!session?.user?.id;

  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: "Unauthorized to chat" }, { status: 403 });
  }

  const fileKey = chat.fileKey;
  const lastMessage = messages[messages.length - 1];
  const lastText = lastMessage.parts[0].text;

  // Persist the user's message; this is independent of building the prompt
  // context, so run them concurrently instead of blocking the stream on the
  // DB write first.
  const saveUserMessage = db.insert(_messages).values({
    id: crypto.randomUUID(),
    chatsId: chatId,
    content: lastText,
    createdAt: new Date(),
    role: "user",
    senderId: session?.user?.id,
    senderName: session?.user?.name || "Collaborator",
  });

  let promptContent = "";

  if (webSearch) {
    const [, result] = await Promise.all([
      saveUserMessage,
      exa.searchAndContents(lastText, {
        type: "neural",
        useAutoprompt: true,
        numResults: 3,
        text: true,
      }),
    ]);

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
    const [, context] = await Promise.all([
      saveUserMessage,
      getContext(lastText.replace(/\n/g, " "), fileKey),
    ]);

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

  // Pre-convert messages once
  const coreMessages = await convertToModelMessages(conversationMessages);

  // Manual fallback for streaming
  try {
    // UNCOMMENT THE LINE BELOW TO TEST GROQ FALLBACK
    // throw new Error("Simulated Gemini Failure for testing fallback");

    // Use a cached health check instead of probing Gemini on every request.
    if (!(await isGeminiHealthy())) {
      throw new Error("Gemini unavailable (cached health check)");
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: promptContent,
      messages: coreMessages,
      maxRetries: 0,
      experimental_transform: smoothStream(),
      async onFinish({ text }) {
        await saveMessageToDb(chatId, text, "system");
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.warn("!!! GEMINI FAILURE !!!", e instanceof Error ? e.message : e);
    console.log("[MODEL_STATS] Falling back to Groq Llama 3.3...");
    try {
      const result = streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: promptContent,
        messages: coreMessages,
        experimental_transform: smoothStream(),
        async onFinish({ text }) {
          await saveMessageToDb(chatId, text, "system");
        },
      });
      console.log("[MODEL_STATS] Groq stream initialized successfully.");
      return result.toUIMessageStreamResponse();
    } catch (groqError) {
      console.error("[MODEL_STATS] FATAL: Groq fallback also failed!", groqError);
      return createUIMessageStreamResponse({
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: "⚠️ AI service is currently unavailable. Please try again later." }],
      } as any);
    }
  }
}

async function saveMessageToDb(chatId: string, content: string, role: "user" | "system") {
  await db.insert(_messages).values({
    id: crypto.randomUUID(),
    chatsId: chatId,
    content: content,
    createdAt: new Date(),
    role: role,
  });
}

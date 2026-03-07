import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, comparisons, comparisonMessages } from "@/lib/db/schema";
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, ModelMessage, smoothStream, UIMessage } from "ai";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

function makeChatIdsKey(chatIds: string[]): string {
  return [...chatIds].sort().join(",");
}

// GET: Check for existing comparison
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatIdsParam = searchParams.get("chatIds");
  if (!chatIdsParam) {
    return NextResponse.json({ error: "Missing chatIds" }, { status: 400 });
  }

  const chatIds = chatIdsParam.split(",");
  const key = makeChatIdsKey(chatIds);

  const existing = await db
    .select()
    .from(comparisons)
    .where(and(eq(comparisons.chatIdsKey, key), eq(comparisons.userId, session.user.id)));

  if (existing.length === 0) {
    return NextResponse.json({ exists: false });
  }

  const msgs = await db
    .select()
    .from(comparisonMessages)
    .where(eq(comparisonMessages.comparisonId, existing[0].id));

  return NextResponse.json({
    exists: true,
    comparisonId: existing[0].id,
    messages: msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(comparisons)
    .where(and(eq(comparisons.id, id), eq(comparisons.userId, session.user.id)));

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(comparisonMessages).where(eq(comparisonMessages.comparisonId, id));
  await db.delete(comparisons).where(eq(comparisons.id, id));

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, chatIds, comparisonId: existingComparisonId } = await req.json();

  if (!chatIds || chatIds.length < 2 || chatIds.length > 3) {
    return NextResponse.json({ error: "Select 2 to 3 documents" }, { status: 400 });
  }

  // Fetch all chats and verify ownership
  const chatRecords = [];
  for (const id of chatIds) {
    const result = await db.select().from(chats).where(eq(chats.id, id));
    if (result.length === 0) {
      return NextResponse.json({ error: `Chat ${id} not found` }, { status: 404 });
    }
    if (result[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    chatRecords.push(result[0]);
  }

  const lastMessage = messages[messages.length - 1];
  const query = lastMessage.parts?.[0]?.text || lastMessage.content || "Compare these documents";
  const isInitialCompare = messages.length === 1 && query === "Compare these documents";

  // Determine or create comparison record
  const key = makeChatIdsKey(chatIds);
  let comparisonId = existingComparisonId;

  if (!comparisonId && isInitialCompare) {
    // Create new comparison record
    comparisonId = crypto.randomUUID();
    await db.insert(comparisons).values({
      id: comparisonId,
      userId: session.user.id,
      chatIdsKey: key,
      createdAt: new Date(),
    });
  }

  // Save user message (for follow-ups)
  if (comparisonId && !isInitialCompare) {
    await db.insert(comparisonMessages).values({
      id: crypto.randomUUID(),
      comparisonId,
      content: query,
      role: "user",
      createdAt: new Date(),
    });
  }

  // Get context from each document
  const contexts = await Promise.all(
    chatRecords.map(async (chat) => {
      const context = await getContext(query.replace(/\n/g, " "), chat.fileKey);
      return {
        name: chat.fileName,
        content: context,
      };
    })
  );

  const contextBlock = contexts
    .map((ctx, i) => `--- DOCUMENT ${i + 1}: "${ctx.name}" ---\n${ctx.content}\n--- END DOCUMENT ${i + 1} ---`)
    .join("\n\n");

  const systemPrompt = isInitialCompare
    ? `You are an expert document analyst. You have been given ${contexts.length} documents to compare.

Your task is to provide a thorough, structured comparison. Use the following format with clear markdown headings:

## Common Ground
List the key points, themes, or facts that the documents agree on or share in common.

## Key Differences
Highlight where the documents differ in their content, approach, perspective, data, or conclusions. Be specific about which document says what.

## Contradictions
Identify any direct contradictions — places where one document states something that conflicts with another. Quote or cite the relevant parts from each document. If there are no contradictions, say so.

## Summary
A brief overall summary of how these documents relate to each other.

Be direct, specific, and cite which document (by name) you are referring to. Do not add filler or conversational text.

${contextBlock}`
    : `You are an expert document analyst. You have access to the following documents for comparison. Answer the user's follow-up question using the document contents below.

Be direct and specific. Always reference which document (by name) you are referring to.

${contextBlock}`;

  const prompt: ModelMessage = {
    role: "system",
    content: systemPrompt,
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
    model: google("gemini-2.5-flash"),
    messages: [prompt, ...convertToModelMessages(conversationMessages)],
    experimental_transform: smoothStream(),
    async onFinish({ text }) {
      if (comparisonId) {
        await db.insert(comparisonMessages).values({
          id: crypto.randomUUID(),
          comparisonId,
          content: text,
          role: "system",
          createdAt: new Date(),
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

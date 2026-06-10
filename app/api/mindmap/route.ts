import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { convertToAscii } from "@/lib/utils";
import { getEmbeddings } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone-client";

export const runtime = "nodejs";
export const maxDuration = 60;

type Meta = { text: string; pageNumber: number };

const SYSTEM_PROMPT = `You are an expert at analyzing documents and producing concise, well-structured concept mind maps.`;

const buildUserPrompt = (context: string) => `Below are excerpts from a document, each tagged with its page number.

Create a hierarchical mind map of the document.

Return ONLY a valid JSON object (no markdown, no commentary) with this exact shape:
{
  "label": "Document title or main topic",
  "page": 1,
  "summary": "<one short sentence>",
  "children": [
    {
      "label": "Major topic or section",
      "page": <page number where this topic starts>,
      "summary": "<one short sentence>",
      "children": [
        { "label": "Subtopic or key concept", "page": <page>, "summary": "<one short sentence>" }
      ]
    }
  ]
}

Rules:
- Maximum 3 levels deep (root + 2 levels of children).
- Aim for 4-7 top-level branches; each may have 2-5 children.
- Labels must be short (2-6 words). Summaries must be one short sentence.
- Always include a "page" field with the most relevant page number from the excerpts.
- Output strictly valid JSON. No trailing commas. No markdown fences.

DOCUMENT EXCERPTS:
${context}`;

function extractJson(raw: string): unknown | null {
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

type MindNode = {
  label: string;
  page?: number;
  summary?: string;
  children?: MindNode[];
};

function sanitize(node: any, depth = 0): MindNode | null {
  if (!node || typeof node !== "object") return null;
  const label = typeof node.label === "string" ? node.label.trim().slice(0, 80) : "";
  if (!label) return null;
  const page = Number.isFinite(node.page) ? Math.max(1, Math.floor(node.page)) : undefined;
  const summary = typeof node.summary === "string" ? node.summary.trim().slice(0, 240) : undefined;
  const children: MindNode[] = [];
  if (depth < 2 && Array.isArray(node.children)) {
    for (const c of node.children) {
      const s = sanitize(c, depth + 1);
      if (s) children.push(s);
      if (children.length >= 8) break;
    }
  }
  return { label, page, summary, children: children.length ? children : undefined };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let chatId: string | undefined;
  try {
    const body = await req.json();
    chatId = body?.chatId;
  } catch {}
  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length !== 1) {
    return NextResponse.json({ error: "chat not found" }, { status: 404 });
  }
  const chat = _chats[0];
  const isOwner = chat.userId === session.user.id;
  const isCollaborator = chat.isShared === "true" && !!session.user.id;
  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Pull a broad sample of chunks across the document
  const ns = convertToAscii(chat.fileKey);

  let chunks: Meta[] = [];
  try {
    const queryEmbedding = await getEmbeddings(
      "main topics, key concepts, sections, headings, structure, summary, overview, conclusion"
    );
    const result = await getPineconeIndex()
      .namespace(ns)
      .query({
        topK: 60,
        vector: queryEmbedding,
        includeMetadata: true,
      });
    chunks = (result.matches || [])
      .map((m) => m.metadata as Meta)
      .filter((m) => m && typeof m.text === "string");
  } catch (e) {
    console.error("Pinecone query failed for mindmap", e);
    return NextResponse.json(
      { error: "Failed to read document index" },
      { status: 500 }
    );
  }

  if (chunks.length === 0) {
    return NextResponse.json(
      { error: "Document has no indexed content yet. Please try again in a moment." },
      { status: 422 }
    );
  }

  // Sort by page so the LLM sees the document in order
  chunks.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));

  let context = "";
  for (const c of chunks) {
    const piece = `[Page ${c.pageNumber || 1}] ${c.text}\n\n`;
    if (context.length + piece.length > 28000) break;
    context += piece;
  }

  const userPrompt = buildUserPrompt(context);

  let raw = "";
  try {
    const r = await generateText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxRetries: 0,
    });
    raw = r.text;
  } catch (e) {
    console.warn("Gemini failed for mindmap, using Groq fallback", e);
    try {
      const r = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      raw = r.text;
    } catch (e2) {
      console.error("Both providers failed for mindmap", e2);
      return NextResponse.json(
        { error: "AI service unavailable. Please try again." },
        { status: 503 }
      );
    }
  }

  const parsed = extractJson(raw);
  const sanitized = parsed ? sanitize(parsed) : null;
  if (!sanitized) {
    return NextResponse.json(
      { error: "Failed to parse mindmap. Please regenerate." },
      { status: 500 }
    );
  }

  return NextResponse.json({ mindmap: sanitized });
}

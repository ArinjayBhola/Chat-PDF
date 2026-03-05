import { db } from "@/lib/db";
import { notes, chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = req.nextUrl.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  // Verify user has access to this chat
  const chat = await db.select().from(chats).where(eq(chats.id, chatId));
  if (!chat.length) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const chatNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.chatId, chatId), eq(notes.userId, session.user.id)));

  return NextResponse.json(chatNotes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, content, source = "manual" } = await req.json();

  if (!chatId || !content) {
    return NextResponse.json(
      { error: "chatId and content are required" },
      { status: 400 }
    );
  }

  const validSources = ["ai_response", "user_message", "manual"];
  if (!validSources.includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const newNote = await db
    .insert(notes)
    .values({
      id: crypto.randomUUID(),
      chatId,
      userId: session.user.id,
      content,
      source,
    })
    .returning();

  return NextResponse.json(newNote[0], { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const noteId = req.nextUrl.searchParams.get("noteId");
  if (!noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }

  // Only allow deleting own notes
  const deleted = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

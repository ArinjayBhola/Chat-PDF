import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { chatId } = await req.json();

  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length === 0) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const chat = _chats[0];

  const isOwner = session?.user?.id === chat.userId;
  const isPubliclyShared = chat.isShared === "true" && chat.allowPublicView === "true";

  if (!isOwner && !isPubliclyShared && !session?.user?.id) {
    // If not owner, not public, and not logged in (to check for collaborator status if we add it here)
    // Actually, for now, if it's not owner and not public, we need to check if they have a session to be a collaborator
    const isCollaborator = chat.isShared === "true" && !!session?.user?.id;
    if (!isCollaborator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const _messages = await db.select().from(messages).where(eq(messages.chatsId, chatId));
  return NextResponse.json({ messages: _messages });
}

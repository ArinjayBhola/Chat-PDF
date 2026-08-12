import { db } from "@/lib/db";
import { chats, messages, notes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { cleanupChatAssets } from "@/lib/chat-cleanup";

export async function DELETE(req: Request) {
  try {
    const { chatId } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // 1. Get the chat to find the fileKey
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    
    if (chat.length === 0) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const fileKey = chat[0].fileKey;

    // Parallelize deletions from Pinecone, S3, and database (notes and messages)
    await Promise.all([
      cleanupChatAssets(fileKey),
      // 4. Delete notes (references chats.id via foreign key)
      db.delete(notes).where(eq(notes.chatId, chatId)),

      // 5. Delete messages
      db.delete(messages).where(eq(messages.chatsId, chatId))
    ]);

    // 6. Finally, delete the chat
    await db.delete(chats).where(eq(chats.id, chatId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

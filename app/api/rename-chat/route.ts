import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { chatId, newName } = await req.json();

    if (!chatId || !newName) {
      return NextResponse.json(
        { error: "Chat ID and new name are required" },
        { status: 400 }
      );
    }

    // 1. Verify the chat exists
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);

    if (chat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // 2. Update the chat name
    await db
      .update(chats)
      .set({ fileName: newName })
      .where(eq(chats.id, chatId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error renaming chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

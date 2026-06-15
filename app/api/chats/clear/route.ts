import { db } from "@/lib/db";
import { messages, chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { chatId } = body;
    if (!chatId) return new NextResponse("Missing chatId", { status: 400 });

    // Verify ownership
    const chatArray = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)))
      .limit(1);
    const chat = chatArray[0];

    if (!chat) {
      return new NextResponse("Unauthorized or Chat not found", { status: 401 });
    }

    await db.delete(messages).where(eq(messages.chatsId, chatId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

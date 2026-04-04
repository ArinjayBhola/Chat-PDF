import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, isPinned } = await req.json();

    if (!chatId || typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "chatId and isPinned are required" }, { status: 400 });
    }

    await db
      .update(chats)
      .set({ isPinned: isPinned ? "true" : "false" })
      .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling pin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

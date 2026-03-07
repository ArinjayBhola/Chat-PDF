import { db } from "@/lib/db";
import { comparisons, chats } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userComparisons = await db
    .select()
    .from(comparisons)
    .where(eq(comparisons.userId, session.user.id))
    .orderBy(desc(comparisons.createdAt));

  // Collect all unique chat IDs
  const allChatIds = new Set<string>();
  for (const c of userComparisons) {
    c.chatIdsKey.split(",").forEach((id) => allChatIds.add(id));
  }

  // Fetch chat names in bulk
  const chatNames: Record<string, string> = {};
  if (allChatIds.size > 0) {
    const chatRecords = await db
      .select({ id: chats.id, fileName: chats.fileName })
      .from(chats)
      .where(inArray(chats.id, Array.from(allChatIds)));
    for (const c of chatRecords) {
      chatNames[c.id] = c.fileName;
    }
  }

  const result = userComparisons.map((c) => ({
    id: c.id,
    chatIdsKey: c.chatIdsKey,
    createdAt: c.createdAt,
    documents: c.chatIdsKey.split(",").map((id) => ({
      id,
      fileName: chatNames[id] || "Deleted document",
    })),
  }));

  return NextResponse.json(result);
}

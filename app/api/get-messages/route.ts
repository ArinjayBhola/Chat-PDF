import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { chatId } = await req.json();
  const _messages = await db.select().from(messages).where(eq(messages.chatsId, chatId));
  return Response.json({ messages: _messages });
}

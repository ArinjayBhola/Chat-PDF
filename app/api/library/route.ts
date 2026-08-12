import { db } from "@/lib/db";
import { chats, messages, notes } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth-options";
import { deleteFromS3 } from "@/lib/s3-server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const files = await db.select().from(chats).where(and(eq(chats.userId, session.user.id), eq(chats.fileDeleted, "false"))).orderBy(chats.createdAt);
  return NextResponse.json(files);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { chatId } = await req.json();
  if (!chatId) return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  const chat = await db.select().from(chats).where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id))).limit(1);
  if (!chat[0]) return NextResponse.json({ error: "File not found" }, { status: 404 });
  await deleteFromS3(chat[0].fileKey);
  await db.update(chats).set({ fileDeleted: "true" }).where(eq(chats.id, chatId));
  return NextResponse.json({ success: true, deleted: "file" });
}

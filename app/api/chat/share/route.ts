import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chatId, isShared, sharePermission, allowPublicView } = body;

    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length !== 1) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (_chats[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate token if not exists and being shared
    let shareToken = _chats[0].shareToken;
    if (isShared && !shareToken) {
      shareToken = crypto.randomUUID();
    }

    await db
      .update(chats)
      .set({
        isShared: isShared ? "true" : "false",
        shareToken,
        sharePermission: sharePermission || "view",
        allowPublicView: allowPublicView ? "true" : "false",
      })
      .where(eq(chats.id, chatId));

    return NextResponse.json({
      success: true,
      shareToken,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();

    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length !== 1) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (_chats[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .update(chats)
      .set({
        isShared: "false",
        shareToken: null,
      })
      .where(eq(chats.id, chatId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

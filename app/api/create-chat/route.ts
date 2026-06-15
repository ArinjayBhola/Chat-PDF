import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getS3Url } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { checkSubscription } from "@/lib/subscription";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parallelize subscription check and user chat count
  const [isPro, userChats] = await Promise.all([
    checkSubscription(),
    db.select().from(chats).where(eq(chats.userId, session.user.id))
  ]);

  if (userChats.length >= 3 && !isPro) {
    return NextResponse.json({ error: "limit_reached" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { file_key, file_name } = body;

    const chat_id = await db
      .insert(chats)
      .values({
        id: crypto.randomUUID(),
        fileKey: file_key,
        fileName: file_name,
        fileUrl: getS3Url(file_key),
        userId: session.user.id,
        pdfStatus: "PROCESSING",
      })
      .returning({
        insertedId: chats.id,
      });

    const insertedChatId = chat_id[0].insertedId;

    try {
      const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://chat.arinjay.dev");

      if (baseUrl.includes("localhost")) {
        // Run locally without QStash (Awaited to prevent Next.js from killing the background task)
        const { loadS3IntoPinecode } = await import("@/lib/pinecone");
        try {
          await loadS3IntoPinecode(file_key);
          await db.update(chats).set({ pdfStatus: "SUCCESS" }).where(eq(chats.id, insertedChatId));
        } catch (e) {
          console.error("Local processing error:", e);
          await db.update(chats).set({ pdfStatus: "FAILED" }).where(eq(chats.id, insertedChatId));
        }
      } else {
        const { Client } = await import("@upstash/qstash");
        const qstashClient = new Client({
          token: process.env.QSTASH_TOKEN!,
        });

        await qstashClient.publishJSON({
          url: `${baseUrl}/api/process-pdf`,
          body: {
            chatId: insertedChatId,
            file_key: file_key,
          },
        });
      }
    } catch (e) {
      console.error("Failed to publish to QStash or start processing:", e);
      // Might want to update status to FAILED or handle it gracefully, but for now log it.
      await db.update(chats).set({ pdfStatus: "FAILED" }).where(eq(chats.id, insertedChatId));
      return NextResponse.json({ error: "Failed to queue PDF processing" }, { status: 500 });
    }

    return NextResponse.json(
      {
        chat_id: insertedChatId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

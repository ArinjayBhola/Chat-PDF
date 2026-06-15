import { NextResponse } from "next/server";
import { loadS3IntoPinecode } from "@/lib/pinecone";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

async function handler(req: Request) {
  try {
    const body = await req.json();
    const { chatId, file_key } = body;

    if (!chatId || !file_key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[QStash] Starting PDF processing for chat: ${chatId}`);

    // Process the PDF
    await loadS3IntoPinecode(file_key);

    // Update chat status to SUCCESS
    await db
      .update(chats)
      .set({ pdfStatus: "SUCCESS" })
      .where(eq(chats.id, chatId));

    console.log(`[QStash] Successfully processed PDF for chat: ${chatId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[QStash] Error processing PDF:", error);

    // Try to extract the chat ID from the request if possible to mark it as failed
    try {
      // Create a fresh request clone because body might have been read
      const reqClone = req.clone();
      const body = await reqClone.json();
      const { chatId } = body;
      
      if (chatId) {
        await db
          .update(chats)
          .set({ pdfStatus: "FAILED" })
          .where(eq(chats.id, chatId));
      }
    } catch {
      // Ignore errors here
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Verify the request came from QStash
export const POST = verifySignatureAppRouter(handler);

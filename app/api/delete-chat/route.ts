import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "@/lib/utils";
import AWS from "aws-sdk";

export async function DELETE(req: Request) {
  try {
    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // 1. Get the chat to find the fileKey
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    
    if (chat.length === 0) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    
    const fileKey = chat[0].fileKey;

    try {
        // 2. Delete vectors from Pinecone
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
        const index = pc.index(process.env.PINECONE_INDEX_NAME!);
        const namespace = convertToAscii(fileKey);
        await index.namespace(namespace).deleteAll();
    } catch (pineconeError) {
        console.error("Error deleting from Pinecone:", pineconeError);
    }
    
    try {
        // 3. Delete file from S3
        AWS.config.update({
          accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
        });
        const s3 = new AWS.S3({
          params: {
            Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
          },
          region: "ap-south-1",
        });
        
        const params = {
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
          Key: fileKey,
        };
        
        await s3.deleteObject(params).promise();
    } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
    }

    // 4. Delete messages first
    await db.delete(messages).where(eq(messages.chatsId, chatId));

    // 5. Delete the chat
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

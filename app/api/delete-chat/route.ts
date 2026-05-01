import { db } from "@/lib/db";
import { chats, messages, notes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "@/lib/utils";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!,
  },
});

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

    // Parallelize deletions from Pinecone, S3, and database (notes and messages)
    await Promise.all([
      // 2. Delete vectors from Pinecone
      (async () => {
        try {
          const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
          });
          const index = pc.index(process.env.PINECONE_INDEX_NAME!);
          const namespace = convertToAscii(fileKey);
          await index.namespace(namespace).deleteAll();
        } catch (pineconeError) {
          console.error("Error deleting from Pinecone:", pineconeError);
        }
      })(),

      // 3. Delete file from S3
      (async () => {
        try {
          const params = {
            Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
            Key: fileKey,
          };
          
          const command = new DeleteObjectCommand(params);
          await s3Client.send(command);
        } catch (s3Error) {
          console.error("Error deleting from S3:", s3Error);
        }
      })(),

      // 4. Delete notes (references chats.id via foreign key)
      db.delete(notes).where(eq(notes.chatId, chatId)),

      // 5. Delete messages
      db.delete(messages).where(eq(messages.chatsId, chatId))
    ]);

    // 6. Finally, delete the chat
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


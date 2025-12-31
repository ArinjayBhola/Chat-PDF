import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecode } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { checkSubscription } from "@/lib/subscription";
import { eq } from "drizzle-orm";

export async function POST(req: Request, res: Response) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isPro = await checkSubscription();
  const userChats = await db.select().from(chats).where(eq(chats.userId, session.user.id));

  if (userChats.length >= 3 && !isPro) {
    return NextResponse.json({ error: "limit_reached" }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { file_key, file_name } = body;

    await loadS3IntoPinecode(file_key);
    const chat_id = await db
      .insert(chats)
      .values({
        id: crypto.randomUUID(),
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId: session.user.id,
      })
      .returning({
        insertedId: chats.id,
      });

    return NextResponse.json(
      {
        chat_id: chat_id[0].insertedId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

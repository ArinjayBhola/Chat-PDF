import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: (process.env.AWS_S3_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY)!,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("key");

  if (!fileKey) {
    return NextResponse.json({ error: "Missing file key" }, { status: 400 });
  }

  const session=await getServerSession(authOptions);
  const available=await db.execute(sql`SELECT c.user_id,c.is_shared,c.allow_public_view FROM chats c JOIN users u ON u.id=c.user_id WHERE c.file_key=${fileKey} AND c.file_deleted='false' AND u.deletion_requested_at IS NULL LIMIT 1`);
  const chat=available.rows[0];
  if(!chat || !(session?.user?.id===chat.user_id || (chat.is_shared==='true' && (chat.allow_public_view==='true' || !!session?.user?.id)))) return NextResponse.json({error:"File unavailable"},{status:403});

  try {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: fileKey,
    };

    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const bytes = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileKey}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}


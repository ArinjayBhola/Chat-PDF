import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: (process.env.AWS_S3_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY)!,
  },
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { file_name, file_type } = await req.json();

    // Sanitize the whole name: replace() with a string only swaps the first
    // match, leaving later spaces/odd chars in the S3 key. Strip everything
    // that isn't safe for a key.
    const safeName = String(file_name).replace(/[^a-zA-Z0-9._-]+/g, "_");
    const file_key = `uploads/${session.user.id}/` + crypto.randomUUID() + "-" + safeName;

    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: file_key,
      ContentType: file_type,
    };

    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({
      uploadUrl,
      file_key,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


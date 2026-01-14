import { NextResponse } from "next/server";
import AWS from "aws-sdk";

export async function POST(req: Request) {
  try {
    const { file_name, file_type } = await req.json();

    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
    });

    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      },
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    });

    const file_key = "uploads/" + Date.now().toString() + file_name.replace(" ", "_");

    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      Key: file_key,
      Expires: 60,
      ContentType: file_type,
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

    return NextResponse.json({
      uploadUrl,
      file_key,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

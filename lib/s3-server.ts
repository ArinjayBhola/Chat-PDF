import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import os from "os";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!,
  },
});

export async function downloadFromS3(file_key: string) {
  try {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: file_key,
    };
    
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error("Empty response body from S3");
    }

    const tmpDir = os.tmpdir();
    const ext = path.extname(file_key) || ".pdf";
    const file_name = path.join(tmpDir, `file-${Date.now()}${ext}`);

    // Ensure the directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const bytes = await response.Body.transformToByteArray();
    fs.writeFileSync(file_name, Buffer.from(bytes));
    
    return file_name;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteFromS3(file_key: string) {
  try {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: file_key,
    };
    
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return false;
  }
}


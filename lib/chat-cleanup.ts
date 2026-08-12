import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "@/lib/utils";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: (process.env.AWS_S3_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID)!,
    secretAccessKey: (process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY)!,
  },
});

export async function cleanupChatAssets(fileKey: string) {
  const results = await Promise.allSettled([
    s3Client.send(new DeleteObjectCommand({ Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!, Key: fileKey })),
    (async () => {
      const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
      await pc.index(process.env.PINECONE_INDEX_NAME!).namespace(convertToAscii(fileKey)).deleteAll();
    })(),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error("Chat asset cleanup failed:", result.reason);
  }
}

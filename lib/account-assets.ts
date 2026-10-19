import "server-only";
import { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand, ListMultipartUploadsCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getPineconeIndex } from "@/lib/pinecone-client";
import { convertToAscii } from "@/lib/utils";
const s3 = new S3Client({ region: process.env.NEXT_PUBLIC_AWS_REGION, credentials: { accessKeyId: (process.env.AWS_S3_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID)!, secretAccessKey: (process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY)! } });
const Bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;
// Remove versions and delete markers too: a simple DeleteObject can leave private data behind.
export async function purgeS3Scope(prefix: string, exact = false) {
 let KeyMarker: string | undefined, VersionIdMarker: string | undefined;
 do {
  const page = await s3.send(new ListObjectVersionsCommand({ Bucket, Prefix: prefix, KeyMarker, VersionIdMarker }));
  const objects = [...(page.Versions || []),...(page.DeleteMarkers || [])].filter(v => v.Key && (!exact || v.Key === prefix)).map(v=>({ Key: v.Key!, VersionId: v.VersionId }));
  if (objects.length) {
   const result = await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: objects, Quiet: true } }));
   if (result.Errors?.length) throw new Error("Storage deletion incomplete");
  }
  KeyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
  VersionIdMarker = page.IsTruncated ? page.NextVersionIdMarker : undefined;
 } while (KeyMarker);
 let KeyMarkerUpload: string | undefined, UploadIdMarker: string | undefined;
 do {
  const page = await s3.send(new ListMultipartUploadsCommand({ Bucket, Prefix: prefix, KeyMarker: KeyMarkerUpload, UploadIdMarker }));
  for (const upload of page.Uploads || []) if (upload.Key && (!exact || upload.Key === prefix)) await s3.send(new AbortMultipartUploadCommand({ Bucket, Key: upload.Key, UploadId: upload.UploadId }));
  KeyMarkerUpload = page.IsTruncated ? page.NextKeyMarker : undefined;
  UploadIdMarker = page.IsTruncated ? page.NextUploadIdMarker : undefined;
 } while (KeyMarkerUpload);
}
export async function purgeDocument(fileKey: string) {
 await purgeS3Scope(fileKey,true);
 try { await getPineconeIndex().namespace(convertToAscii(fileKey)).deleteAll(); }
 catch (error) {
  // Missing namespaces are already clean; authentication, network and other failures must be retried.
  if (!(error instanceof Error) || error.name !== "PineconeNotFoundError") throw error;
 }
}

import "dotenv/config";
import { db } from "../lib/db";
import { chats } from "../lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getS3Size } from "../lib/s3-server";
async function main() {
 const rows = await db.select({ id: chats.id, key: chats.fileKey }).from(chats).where(and(isNull(chats.fileSizeBytes), eq(chats.fileDeleted, "false")));
 let updated = 0, failed = 0;
 for (const row of rows) {
  try { const size = await getS3Size(row.key); if (size !== null) { await db.update(chats).set({ fileSizeBytes: size }).where(eq(chats.id,row.id)); updated++; } }
  catch { failed++; }
 }
 console.log({ updated, failed });
}
main().catch(() => { console.error("File size backfill failed"); process.exitCode = 1; });

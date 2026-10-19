import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
export async function startProcessing(fileKey: string) {
 const id=crypto.randomUUID();
 const result=await db.execute(sql`INSERT INTO processing_leases(id,user_id,expires_at) SELECT ${id},u.id,(now() AT TIME ZONE 'UTC')+interval '10 minutes' FROM chats c JOIN users u ON u.id=c.user_id WHERE c.file_key=${fileKey} AND u.deletion_requested_at IS NULL AND c.file_deleted='false' RETURNING id`);
 if (!result.rows.length) throw new Error("Document no longer available");
 return {
  async renew() {
   const result=await db.execute(sql`UPDATE processing_leases SET expires_at=(now() AT TIME ZONE 'UTC')+interval '10 minutes' WHERE id=${id} RETURNING id`);
   if (!result.rows.length) throw new Error("Document processing stopped");
  },
  async release() { await db.execute(sql`DELETE FROM processing_leases WHERE id=${id}`); },
 };
}

import { accountDeletionSql } from "@/lib/account-deletion-sql";
import "server-only";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { purgeDocument, purgeS3Scope } from "@/lib/account-assets";
import { dodo } from "@/lib/dodopayments";
export type DeleteProgress = { done: boolean; message: string };
export async function deleteUserData(userId: string, actorId: string): Promise<DeleteProgress> {
 const [,state] = await db.batch([
  db.execute(sql`UPDATE chats SET is_shared='false',allow_public_view='false',share_token=NULL WHERE user_id=${userId} AND EXISTS (SELECT 1 FROM users WHERE id=${userId} AND deletion_requested_at IS NULL)`),
  db.execute(sql`UPDATE users SET deletion_requested_at=COALESCE(deletion_requested_at,now() AT TIME ZONE 'UTC') WHERE id=${userId} RETURNING email,deletion_requested_at`),
 ]);
 if (!state.rows[0]) return { done: true, message: "Account already removed." };
 // The account is revoked before any slow external work. A retry resumes the same durable queue.
 await db.execute(sql`INSERT INTO deletion_assets(user_id,file_key) SELECT user_id,file_key FROM chats WHERE user_id=${userId} UNION SELECT user_id,file_key FROM user_uploads WHERE user_id=${userId} ON CONFLICT DO NOTHING`);
 const pending = await db.execute(sql`SELECT EXISTS(SELECT 1 FROM processing_leases WHERE user_id=${userId} AND expires_at > (now() AT TIME ZONE 'UTC')) AS processing, (SELECT deletion_requested_at + interval '70 seconds' > (now() AT TIME ZONE 'UTC') FROM users WHERE id=${userId}) AS uploads`);
 if (pending.rows[0].processing || pending.rows[0].uploads) return { done: false, message: "Access revoked. Waiting for uploads and document processing to stop safely." };
 const subscription = await db.execute(sql`SELECT dodo_subscription_id FROM user_subscriptions WHERE user_id=${userId}`);
 for (const row of subscription.rows) if (row.dodo_subscription_id) {
  try {
   const remote = await dodo.subscriptions.retrieve(String(row.dodo_subscription_id));
   if (remote.status !== "cancelled") await dodo.subscriptions.update(String(row.dodo_subscription_id), { status: "cancelled" });
  } catch (error) {
   if (!(typeof error === "object" && error && "status" in error && error.status === 404)) throw new Error("Subscription cancellation failed. Retry deletion.");
  }
 }
 const assets = await db.execute(sql`SELECT file_key FROM deletion_assets WHERE user_id=${userId} AND cleaned_at IS NULL ORDER BY file_key LIMIT 5`);
 for (const row of assets.rows) {
  const key=String(row.file_key);
  const others=await db.execute(sql`SELECT 1 FROM chats WHERE file_key=${key} AND user_id<>${userId} LIMIT 1`);
  if (others.rows.length) throw new Error("A file is referenced by another account. Cleanup requires review.");
  await purgeDocument(key);
  await db.execute(sql`UPDATE deletion_assets SET cleaned_at=now() WHERE user_id=${userId} AND file_key=${key}`);
 }
 const remaining=await db.execute(sql`SELECT 1 FROM deletion_assets WHERE user_id=${userId} AND cleaned_at IS NULL LIMIT 1`);
 if (remaining.rows.length) return { done: false, message: "Access revoked. Removing stored documents and their indexes." };
 // Includes abandoned uploads with no chat record, scoped to this account only.
 await purgeS3Scope("uploads/"+userId+"/");
 const [first,...rest]=accountDeletionSql(userId,String(state.rows[0].email),actorId);
 // Neon HTTP batches are transactional: either all relational data is removed or none is.
 await db.batch([db.execute(first),...rest.map(statement=>db.execute(statement))]);
 return { done: true, message: "User and account data deleted." };
}

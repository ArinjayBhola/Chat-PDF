import { sql, type SQL } from "drizzle-orm";
export function accountDeletionSql(userId:string,email:string,actorId:string): [SQL,...SQL[]] {
 const relatedComparisons = sql`SELECT id FROM comparisons WHERE user_id=${userId} OR string_to_array(chat_ids_key,',') && ARRAY(SELECT id::text FROM chats WHERE user_id=${userId})`;
 const ownedChats=sql`SELECT id FROM chats WHERE user_id=${userId}`;
 return [
  sql`DELETE FROM comparison_messages WHERE comparison_id IN (${relatedComparisons})`,
  sql`DELETE FROM comparisons WHERE id IN (${relatedComparisons})`,
  sql`DELETE FROM notes WHERE user_id=${userId} OR chat_id IN (${ownedChats})`,
  sql`DELETE FROM messages WHERE sender_id=${userId} OR chat_id IN (${ownedChats})`,
  sql`DELETE FROM chats WHERE user_id=${userId}`,
  sql`DELETE FROM otps WHERE email=${email}`,
  sql`DELETE FROM admin_access_logs WHERE actor_id=${userId}`,
  sql`DELETE FROM users WHERE id=${userId}`,
  sql`INSERT INTO admin_access_logs(id,actor_id,outcome,action) VALUES (${crypto.randomUUID()},${actorId},'allowed','user_deleted')`,
 ];
}

import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { accountDeletionSql } from "../lib/account-deletion-sql";

test("account removal deletes all relational data and related shared data, preserves unrelated accounts",async()=>{
 const a=crypto.randomUUID(),b=crypto.randomUUID(),chat=crypto.randomUUID(),otherChat=crypto.randomUUID(),comparison=crypto.randomUUID(),related=crypto.randomUUID(),unrelated=crypto.randomUUID();
 const email=a+"@deletion-test.invalid";
 const statements=[
 sql`INSERT INTO users(id,email) VALUES (${a},${email}),(${b},${b+"@deletion-test.invalid"})`,
 sql`INSERT INTO accounts(user_id,type,provider,provider_account_id) VALUES (${a},'oauth','test',${a})`,
 sql`INSERT INTO folders(id,user_id,name) VALUES (${crypto.randomUUID()},${a},'test')`,
 sql`INSERT INTO chats(id,user_id,pdf_name,pdf_url,file_key) VALUES (${chat},${a},'test','test',${a}),(${otherChat},${b},'other','other',${b})`,
 sql`INSERT INTO notes(id,user_id,chat_id,content) VALUES (${crypto.randomUUID()},${a},${otherChat},'a note elsewhere'),(${crypto.randomUUID()},${b},${chat},'collaborator note')`,
 sql`INSERT INTO messages(id,chat_id,content,role,sender_id) VALUES (${crypto.randomUUID()},${chat},'test','system',NULL),(${crypto.randomUUID()},${otherChat},'test','user',${a})`,
 sql`INSERT INTO comparisons(id,user_id,chat_ids_key) VALUES (${comparison},${a},${chat}),(${related},${b},${chat+','+otherChat}),(${unrelated},${b},${otherChat})`,
 sql`INSERT INTO comparison_messages(id,comparison_id,content,role) VALUES (${crypto.randomUUID()},${comparison},'test','system'),(${crypto.randomUUID()},${related},'test','user')`,
 sql`INSERT INTO user_subscriptions(id,user_id) VALUES (${crypto.randomUUID()},${a})`,
 sql`INSERT INTO otps(id,email,otp,type,expires_at) VALUES (${crypto.randomUUID()},${email},'test','reset',now())`,
 sql`INSERT INTO user_uploads(file_key,user_id) VALUES (${a},${a})`,
 sql`INSERT INTO deletion_assets(user_id,file_key) VALUES (${a},${a})`,
 sql`INSERT INTO processing_leases(id,user_id,expires_at) VALUES (${crypto.randomUUID()},${a},now())`,
 sql`INSERT INTO activity_visits(id,user_id,route,active_seconds) VALUES (${crypto.randomUUID()},${a},'/chat',10)`,
 sql`INSERT INTO model_usage(id,user_id,model,feature) VALUES (${crypto.randomUUID()},${a},'test','chat')`,
 sql`INSERT INTO daily_activity(user_id) VALUES (${a})`,
 sql`INSERT INTO daily_activity_ist(user_id) VALUES (${a})`,
 sql`INSERT INTO admin_access_logs(id,actor_id,outcome,action) VALUES (${crypto.randomUUID()},${a},'denied','test')`,
 sql`UPDATE users SET deletion_requested_at=now() WHERE id=${a}`,
 ...accountDeletionSql(a,email,b),
 sql`SELECT 1 / CASE WHEN
 NOT EXISTS(SELECT 1 FROM users WHERE id=${a}) AND
 NOT EXISTS(SELECT 1 FROM chats WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM notes WHERE user_id=${a} OR chat_id=${chat}) AND
 NOT EXISTS(SELECT 1 FROM messages WHERE sender_id=${a} OR chat_id=${chat}) AND
 NOT EXISTS(SELECT 1 FROM comparison_messages WHERE comparison_id IN (${comparison},${related})) AND
 NOT EXISTS(SELECT 1 FROM comparisons WHERE id IN (${comparison},${related})) AND
 NOT EXISTS(SELECT 1 FROM accounts WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM folders WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM user_subscriptions WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM otps WHERE email=${email}) AND
 NOT EXISTS(SELECT 1 FROM user_uploads WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM deletion_assets WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM processing_leases WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM activity_visits WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM model_usage WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM daily_activity WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM daily_activity_ist WHERE user_id=${a}) AND
 NOT EXISTS(SELECT 1 FROM admin_access_logs WHERE actor_id=${a}) AND
 EXISTS(SELECT 1 FROM users WHERE id=${b}) AND EXISTS(SELECT 1 FROM chats WHERE id=${otherChat}) AND EXISTS(SELECT 1 FROM comparisons WHERE id=${unrelated})
 THEN 1 ELSE 0 END AS verified`,
 ...accountDeletionSql(b,b+"@deletion-test.invalid",b),
 sql`DELETE FROM admin_access_logs WHERE actor_id=${b}`,
 ];
 const [first,...rest]=statements;
 await db.batch([db.execute(first),...rest.map(s=>db.execute(s))]);
});

test("writes from a stale session are rejected and their transaction rolls back",async()=>{
 const id=crypto.randomUUID();
 await assert.rejects(db.batch([
  db.execute(sql`INSERT INTO users(id,email) VALUES (${id},${id+"@deletion-test.invalid"})`),
  db.execute(sql`UPDATE users SET deletion_requested_at=now() WHERE id=${id}`),
  db.execute(sql`INSERT INTO chats(id,user_id,pdf_name,pdf_url,file_key) VALUES (${crypto.randomUUID()},${id},'test','test','test')`),
 ]));
 const rows=await db.execute(sql`SELECT id FROM users WHERE id=${id}`);
 assert.equal(rows.rows.length,0);
});

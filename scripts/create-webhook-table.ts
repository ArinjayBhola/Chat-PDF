import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

// Additive, idempotent: creates the webhook idempotency table if it's missing.
// Safe to run against any environment.
async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
      "id" text PRIMARY KEY NOT NULL,
      "event_type" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log("processed_webhook_events ready.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

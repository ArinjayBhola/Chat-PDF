import "dotenv/config";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  console.log("Checking DB connections...");
  const latestChats = await db.select().from(chats).orderBy(desc(chats.createdAt)).limit(5);
  console.log("Latest Chats:", latestChats);
  process.exit(0);
}

main();

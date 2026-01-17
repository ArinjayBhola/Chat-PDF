import "dotenv/config";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { desc, isNull, eq } from "drizzle-orm";
import { generateSummaryAndQuestions } from "@/lib/summary-service";

async function main() {
  console.log("Fetching recent chats without summaries...");
  
  // Get last 5 chats that don't have a summary
  const recentChats = await db
    .select()
    .from(chats)
    .where(isNull(chats.summary))
    .orderBy(desc(chats.createdAt))
    .limit(5);

  console.log(`Found ${recentChats.length} chats to migrate.`);

  for (const chat of recentChats) {
    console.log(`Processing chat: ${chat.pdfName} (${chat.fileKey})...`);
    try {
      const result = await generateSummaryAndQuestions(chat.fileKey);
      
      if (result.summary) {
        await db
          .update(chats)
          .set({
            summary: result.summary,
            suggestedQuestions: result.suggestedQuestions,
          })
          .where(eq(chats.id, chat.id));
        console.log(`✅ Updated chat ${chat.id}`);
      } else {
        console.log(`❌ Failed to generate summary for ${chat.id}`);
      }
    } catch (error) {
      console.error(`Error processing ${chat.id}:`, error);
    }
  }

  console.log("Migration complete.");
  process.exit(0);
}

main().catch(console.error);

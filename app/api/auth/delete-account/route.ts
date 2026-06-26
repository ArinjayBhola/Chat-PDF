import { db } from "@/lib/db";
import { 
  users, 
  chats, 
  messages, 
  notes, 
  comparisons, 
  comparisonMessages, 
  userSubscriptions, 
  folders 
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    
    if (!dbUser || dbUser.length === 0) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    const userId = dbUser[0].id;

    // 1. Get user's chats to delete associated messages
    const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, userId));
    const chatIds = userChats.map(c => c.id);

    if (chatIds.length > 0) {
      await db.delete(messages).where(inArray(messages.chatsId, chatIds));
    }

    // 2. Get user's comparisons to delete associated messages
    const userComparisons = await db.select({ id: comparisons.id }).from(comparisons).where(eq(comparisons.userId, userId));
    const comparisonIds = userComparisons.map(c => c.id);

    if (comparisonIds.length > 0) {
      await db.delete(comparisonMessages).where(inArray(comparisonMessages.comparisonId, comparisonIds));
    }

    // 3. Delete records directly tied to userId
    await db.delete(notes).where(eq(notes.userId, userId));
    await db.delete(comparisons).where(eq(comparisons.userId, userId));
    await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId));
    
    // 4. Delete chats and then folders
    await db.delete(chats).where(eq(chats.userId, userId));
    await db.delete(folders).where(eq(folders.userId, userId));

    // Finally delete the user itself
    await db.delete(users).where(eq(users.id, userId));

    return new NextResponse("Account deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete account error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

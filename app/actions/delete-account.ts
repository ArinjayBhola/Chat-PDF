"use server";

import { db } from "@/lib/db";
import { chats, messages, userSubscriptions, users, notes, comparisons, comparisonMessages, folders } from "@/lib/db/schema";
import { otps } from "@/lib/db/auth-schema";
import { eq, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { cleanupChatAssets } from "@/lib/chat-cleanup";

export async function deleteAccount() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // Get user from db to verify and get ID
    const userResult = await db.select().from(users).where(eq(users.email, session.user.email));
    const user = userResult[0];

    if (!user) {
        throw new Error("User not found");
    }

    const userId = user.id;

    // 1. Get all chats to clean up S3 files
    const userChats = await db.select().from(chats).where(eq(chats.userId, userId));

    const chatIds = userChats.map((chat) => chat.id);
    const userComparisons = await db.select({ id: comparisons.id }).from(comparisons).where(eq(comparisons.userId, userId));
    const comparisonIds = userComparisons.map((comparison) => comparison.id);

    // 2. Delete external assets and chat-related rows
    for (const chat of userChats) {
      if (chat.fileKey) {
        await cleanupChatAssets(chat.fileKey);
      }
    }
    if (chatIds.length) {
      await db.delete(messages).where(inArray(messages.chatsId, chatIds));
      await db.delete(notes).where(inArray(notes.chatId, chatIds));
    }
    if (comparisonIds.length) {
      await db.delete(comparisonMessages).where(inArray(comparisonMessages.comparisonId, comparisonIds));
    }
    await db.delete(comparisons).where(eq(comparisons.userId, userId));
    await db.delete(folders).where(eq(folders.userId, userId));
    await db.delete(otps).where(eq(otps.email, user.email));

    // 3. Delete chats
    await db.delete(chats).where(eq(chats.userId, userId));

    // 4. Delete subscriptions
    await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId));

    // 6. Delete user
    await db.delete(users).where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

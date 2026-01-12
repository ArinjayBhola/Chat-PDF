"use server";

import { db } from "@/lib/db";
import { chats, messages, userSubscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deleteFromS3 } from "@/lib/s3-server";

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

    // 2. Delete S3 files and related messages
    for (const chat of userChats) {
      if (chat.fileKey) {
        await deleteFromS3(chat.fileKey);
      }
      // Delete messages for this chat
      await db.delete(messages).where(eq(messages.chatsId, chat.id));
    }

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

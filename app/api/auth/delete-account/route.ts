import { db } from "@/lib/db";
import { users } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Since users.id is what accounts/chats reference, and auth-schema cascades accounts onDelete,
    // we just need to delete the user. Wait,chats are referenced by user_id which is a text matching users.id or clerk id.
    // Actually, in schema.ts chats don't have a cascading foreign key, they just have userId: text("user_id").
    // We should delete chats explicitly if we want a clean wipe.
    const { chats } = await import("@/lib/db/schema");
    
    // The user's ID might be in session.user.id if NextAuth is configured, or we can look it up by email.
    const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    
    if (!dbUser || dbUser.length === 0) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    const userId = dbUser[0].id;

    // Delete chats associated with this user
    await db.delete(chats).where(eq(chats.userId, userId));

    // Finally delete the user itself
    await db.delete(users).where(eq(users.id, userId));

    return new NextResponse("Account deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Delete account error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

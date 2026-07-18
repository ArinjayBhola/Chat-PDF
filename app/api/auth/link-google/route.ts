import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/auth-schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Disconnect the Google account from the current user. Refused if the user has
// no password, otherwise they'd be left with no way to sign in.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!rows[0].password) {
      return NextResponse.json(
        { error: "Set a password first, otherwise you'd be locked out." },
        { status: 400 },
      );
    }

    await db
      .delete(accounts)
      .where(and(eq(accounts.userId, session.user.id), eq(accounts.provider, "google")));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GOOGLE_DISCONNECT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

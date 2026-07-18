import { db } from "@/lib/db";
import { users } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Lets a Google/OAuth user (who has no password yet) set one, so they can also
// sign in with email + password. Session-authenticated; the email is already
// verified via the OAuth provider, so no OTP is required here. Users who
// already have a password must use the OTP-based change-password flow instead.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const rows = await db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (rows[0].password) {
      // Already has a password — must go through the verified change flow.
      return NextResponse.json({ error: "A password is already set. Use Change Password." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SET_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

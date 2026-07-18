import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Step 1 of "Connect Google" from settings. Records — in a short-lived,
// httpOnly cookie — the email of the currently signed-in user. The NextAuth
// signIn callback reads this cookie during the Google OAuth callback and
// refuses to link if the Google account's email doesn't match, so a user can't
// attach a Google identity that belongs to a different email.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("pending_google_link", session.user.email, {
    httpOnly: true,
    sameSite: "lax", // must be sent on the top-level GET redirect back from Google
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
  return res;
}

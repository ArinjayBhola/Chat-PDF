import { db } from "@/lib/db";
import { users, otps } from "@/lib/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "This email does not exist, please create an account." },
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // If the user registered with Google and doesn't have a password, they should sign in with Google
    if (!user.password) {
      return NextResponse.json(
        { error: "This email is associated with a Google account. Please log in with Google." },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing reset OTPs for this email to prevent spam/clutter
    await db.delete(otps).where(and(eq(otps.email, email), eq(otps.type, 'reset')));

    // Set expiry to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save OTP to DB
    await db.insert(otps).values({
      email,
      otp,
      type: "reset",
      expiresAt,
    });

    // Send the email
    try {
      await sendPasswordResetEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "If an account exists with this email, a reset password OTP has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

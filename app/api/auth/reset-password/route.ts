import { db } from "@/lib/db";
import { users, otps } from "@/lib/db/auth-schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword, currentPassword, isChange } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isChange && !currentPassword) {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    // Check if OTP is valid
    const validOtp = await db
      .select()
      .from(otps)
      .where(and(eq(otps.email, email), eq(otps.otp, otp), eq(otps.type, "reset")))
      .limit(1);

    if (validOtp.length === 0) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    const otpRecord = validOtp[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.delete(otps).where(eq(otps.id, otpRecord.id));
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    // Verify current password if this is a password change request
    if (isChange) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = existingUser[0];
      if (!user.password) {
        return NextResponse.json({ error: "Cannot change password for OAuth account" }, { status: 400 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email));

    // Delete used OTP
    await db.delete(otps).where(eq(otps.id, otpRecord.id));

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

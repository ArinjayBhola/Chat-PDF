import { db } from "@/lib/db";
import { users, otps } from "@/lib/db/auth-schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Missing email or OTP" },
        { status: 400 }
      );
    }

    // Explicitly verify credentials registration
    if (!name || !password) {
      return NextResponse.json(
        { error: "Missing name or password for registration" },
        { status: 400 }
      );
    }

    // Check if OTP is valid
    const validOtp = await db
      .select()
      .from(otps)
      .where(and(eq(otps.email, email), eq(otps.otp, otp), eq(otps.type, "verification")))
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

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(),
        image: null,
      })
      .returning();

    // Delete used OTP
    await db.delete(otps).where(eq(otps.id, otpRecord.id));

    return NextResponse.json(
      { 
        message: "Email verified and user created successfully",
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

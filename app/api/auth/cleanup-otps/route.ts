import { db } from "@/lib/db";
import { otps } from "@/lib/db/auth-schema";
import { lt } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/cleanup-otps
 * Deletes all OTPs that have passed their 10-minute expiry.
 * Can be triggered manually or via an external cron service (e.g. Vercel Cron, cron-job.org).
 */
export async function GET() {
  try {
    const result = await db
      .delete(otps)
      .where(lt(otps.expiresAt, new Date()))
      .returning({ id: otps.id });

    return NextResponse.json(
      { message: `Cleaned up ${result.length} expired OTP(s)` },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { resolvedSearchParams, userId } = await req.json();
  try {
    const isUserPresent = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);
    if (isUserPresent.length > 0) {
      return new NextResponse(null, { status: 200 });
    }
  } catch (error) {
    console.error("Error checking existing subscription:", error);
  }

  try {
    await db.insert(userSubscriptions).values({
      id: crypto.randomUUID(),
      userId: userId,
      razorpayPaymentId: resolvedSearchParams.razorpay_payment_id as string,
      razorpayPaymentLinkId: resolvedSearchParams.razorpay_payment_link_id as string,
      razorpayPaymentLinkStatus: resolvedSearchParams.razorpay_payment_link_status as string,
      razorpaySignature: resolvedSearchParams.razorpay_signature as string,
    });
  } catch (error) {
    console.error("Failed to update subscription status:", error);
  }

  return new NextResponse(null, { status: 200 });
}

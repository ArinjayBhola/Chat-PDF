import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  // 1. Verify user is authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${baseUrl}/?payment=unauthorized`);
  }

  // 2. Extract Razorpay callback params
  const razorpayPaymentId = url.searchParams.get("razorpay_payment_id");
  const razorpayPaymentLinkId = url.searchParams.get(
    "razorpay_payment_link_id"
  );
  const razorpayPaymentLinkRefId = url.searchParams.get(
    "razorpay_payment_link_reference_id"
  );
  const razorpayPaymentLinkStatus = url.searchParams.get(
    "razorpay_payment_link_status"
  );
  const razorpaySignature = url.searchParams.get("razorpay_signature");

  // 3. Validate all required params are present
  if (
    !razorpayPaymentId ||
    !razorpayPaymentLinkId ||
    !razorpayPaymentLinkRefId ||
    !razorpayPaymentLinkStatus ||
    !razorpaySignature
  ) {
    console.error("[PAYMENT_CALLBACK] Missing required parameters");
    return NextResponse.redirect(`${baseUrl}/?payment=missing_params`);
  }

  // 4. Verify Razorpay signature using HMAC-SHA256
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("[PAYMENT_CALLBACK] RAZORPAY_KEY_SECRET not configured");
    return NextResponse.redirect(`${baseUrl}/?payment=config_error`);
  }

  const payload =
    razorpayPaymentLinkId +
    "|" +
    razorpayPaymentLinkRefId +
    "|" +
    razorpayPaymentLinkStatus +
    "|" +
    razorpayPaymentId;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    console.error("[PAYMENT_CALLBACK] Invalid signature", {
      expected: expectedSignature,
      received: razorpaySignature,
    });
    return NextResponse.redirect(`${baseUrl}/?payment=invalid_signature`);
  }

  // 5. Verify payment status is "paid"
  if (razorpayPaymentLinkStatus !== "paid") {
    console.error(
      "[PAYMENT_CALLBACK] Payment not completed, status:",
      razorpayPaymentLinkStatus
    );
    return NextResponse.redirect(`${baseUrl}/?payment=not_paid`);
  }

  // 6. Create or update subscription in DB
  try {
    const existingSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user.id))
      .limit(1);

    const subscriptionEndDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    if (existingSubscription.length > 0) {
      // Update existing subscription (handles renewal)
      await db
        .update(userSubscriptions)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          razorpayPaymentLinkId: razorpayPaymentLinkId,
          razorpayPaymentLinkStatus: razorpayPaymentLinkStatus,
          razorpaySignature: razorpaySignature,
          subscriptionEndDate: subscriptionEndDate,
        })
        .where(eq(userSubscriptions.userId, session.user.id));
    } else {
      // Create new subscription
      await db.insert(userSubscriptions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        razorpayPaymentId: razorpayPaymentId,
        razorpayPaymentLinkId: razorpayPaymentLinkId,
        razorpayPaymentLinkStatus: razorpayPaymentLinkStatus,
        razorpaySignature: razorpaySignature,
        subscriptionEndDate: subscriptionEndDate,
      });
    }
  } catch (error) {
    console.error("[PAYMENT_CALLBACK] Database error:", error);
    return NextResponse.redirect(`${baseUrl}/?payment=db_error`);
  }

  // 7. Redirect to home with success
  return NextResponse.redirect(`${baseUrl}/?payment=success`);
}

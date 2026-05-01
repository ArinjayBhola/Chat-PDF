import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { sendSubscriptionCancellationEmail } from "@/lib/mail";
import { dodo } from "@/lib/dodopayments";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    // 1. Fetch current active subscription
    const existingSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user.id))
      .limit(1);

    const subscription = existingSubscriptions[0];

    if (!subscription || subscription.status !== "active") {
      return new NextResponse("No active subscription found", { status: 400 });
    }

    if (!subscription.subscriptionEndDate) {
      return new NextResponse("Subscription end date missing", { status: 400 });
    }

    // 2. Calculate Pro-rata Refund
    const now = new Date();
    const endDate = new Date(subscription.subscriptionEndDate);
    const msRemaining = endDate.getTime() - now.getTime();
    
    // Total period assumed to be 30 days
    const totalMs = 30 * 24 * 60 * 60 * 1000;
    const daysRemaining = Math.max(0, msRemaining / (1000 * 60 * 60 * 24));
    
    // Calculate refund amount in paise (99900 = Rs 999)
    const refundAmount = Math.floor((daysRemaining / 30) * 99900);

    // 3. Execute actual Dodo Payments actions
    try {
      // Cancel subscription if it exists
      if (subscription.dodoSubscriptionId) {
        await dodo.subscriptions.update(subscription.dodoSubscriptionId, {
          status: "cancelled",
        });
      }

      // Issue refund if payment ID exists and refund amount > 0
      if (subscription.dodoPaymentId && refundAmount > 0) {
        await dodo.refunds.create({
          payment_id: subscription.dodoPaymentId,
          reason: "customer_request",
        });
      }
    } catch (dodoError) {
      console.error("[DODO_API_ERROR_DURING_CANCELLATION]", dodoError);
      return new NextResponse("Failed to process cancellation with payment provider", { status: 500 });
    }

    // 4. Update DB
    await db
      .update(userSubscriptions)
      .set({
        status: "cancelled",
        subscriptionEndDate: now, // Revoke immediately as we are refunding
      })
      .where(eq(userSubscriptions.userId, session.user.id));

    // 5. Send Cancellation Email
    try {
      await sendSubscriptionCancellationEmail(session.user.email!, refundAmount);
    } catch (emailError) {
      console.error("[CANCEL_SUBSCRIPTION_EMAIL_ERROR]", emailError);
    }

    return NextResponse.json({
      message: "Subscription cancelled and refund initiated",
      refundAmount: refundAmount,
      daysRemaining: Math.floor(daysRemaining),
    });
  } catch (error) {
    console.error("[CANCEL_SUBSCRIPTION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

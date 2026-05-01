import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headers = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("DODO_PAYMENTS_WEBHOOK_SECRET is not set");
      return new NextResponse("Webhook secret not set", { status: 500 });
    }

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(body, headers);
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const eventType = evt.event_type;
    const data = evt.data;

    console.log(`[DODO_WEBHOOK] Received event: ${eventType}`, data);

    // Handle payment or subscription success/renewal
    if (
      eventType === "payment.succeeded" || 
      eventType === "subscription.active" || 
      eventType === "subscription.renewed"
    ) {
      const userId = data.metadata?.userId;
      if (!userId) {
        console.error("No userId in metadata for event:", eventType);
        return new NextResponse("No userId in metadata", { status: 200 });
      }

      // Fetch existing subscription to handle renewals correctly
      const existingSub = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .limit(1);

      let subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // If it's a renewal and we have an existing valid end date, add to it
      if (eventType === "subscription.renewed" && existingSub[0]?.subscriptionEndDate) {
        const currentEndDate = new Date(existingSub[0].subscriptionEndDate);
        if (currentEndDate > new Date()) {
          subscriptionEndDate = new Date(currentEndDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
      }

      await db
        .insert(userSubscriptions)
        .values({
          id: crypto.randomUUID(),
          userId: userId,
          dodoPaymentId: data.payment_id || null,
          dodoSubscriptionId: data.subscription_id || null,
          dodoCustomerId: data.customer_id || null,
          subscriptionEndDate: subscriptionEndDate,
          status: "active",
        })
        .onConflictDoUpdate({
          target: userSubscriptions.userId,
          set: {
            dodoPaymentId: data.payment_id || null,
            dodoSubscriptionId: data.subscription_id || null,
            dodoCustomerId: data.customer_id || null,
            subscriptionEndDate: subscriptionEndDate,
            status: "active",
          },
        });
    } else if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
      const userId = data.metadata?.userId;
      if (userId) {
        await db
          .update(userSubscriptions)
          .set({
            status: eventType === "subscription.cancelled" ? "cancelled" : "expired",
            // For cancellations, we might want to keep the end date as is 
            // so they keep access until the period ends (Dodo behavior)
          })
          .where(eq(userSubscriptions.userId, userId));
      }
    } else if (eventType === "payment.failed" || eventType === "subscription.failed") {
      const userId = data.metadata?.userId;
      if (userId) {
        await db
          .update(userSubscriptions)
          .set({ status: "failed" })
          .where(eq(userSubscriptions.userId, userId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DODO_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

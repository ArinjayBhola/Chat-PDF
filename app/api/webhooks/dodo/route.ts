import { db } from "@/lib/db";
import { userSubscriptions, processedWebhookEvents } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import crypto from "crypto";
import { eq, or } from "drizzle-orm";

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

    // Idempotency: skip a delivery we've already applied. Dodo retries on any
    // non-2xx, and the same event can be delivered more than once — without
    // this, "renewed" would add another 30 days each time.
    const webhookId = headers["webhook-id"];
    if (webhookId) {
      const already = await db
        .select()
        .from(processedWebhookEvents)
        .where(eq(processedWebhookEvents.id, webhookId))
        .limit(1);
      if (already.length > 0) {
        console.log(`[DODO_WEBHOOK] Duplicate delivery ${webhookId}, skipping`);
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    console.log(`[DODO_WEBHOOK] Received event: ${eventType}`, data);

    // Handle payment or subscription success/renewal
    if (
      eventType === "payment.succeeded" || 
      eventType === "subscription.active" || 
      eventType === "subscription.renewed"
    ) {
      let userId = data.metadata?.userId as string | undefined;

      // Renewal/active events don't always echo the checkout metadata, so fall
      // back to matching an existing row by the Dodo subscription/customer id.
      let existingSub: (typeof userSubscriptions.$inferSelect)[] = [];
      if (userId) {
        existingSub = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId))
          .limit(1);
      } else {
        const conditions = [];
        if (data.subscription_id) conditions.push(eq(userSubscriptions.dodoSubscriptionId, data.subscription_id));
        if (data.customer_id) conditions.push(eq(userSubscriptions.dodoCustomerId, data.customer_id));
        if (conditions.length > 0) {
          existingSub = await db
            .select()
            .from(userSubscriptions)
            .where(conditions.length === 1 ? conditions[0] : or(...conditions))
            .limit(1);
          userId = existingSub[0]?.userId;
        }
      }

      if (!userId) {
        console.error("Could not resolve userId for event:", eventType);
        return new NextResponse("No userId resolved", { status: 200 });
      }

      // Idempotency guard: webhooks can be delivered more than once. Without
      // this, a duplicate "renewed" delivery would stack another 30 days onto
      // the end date for free. A given payment_id is only applied once.
      if (data.payment_id && existingSub[0]?.dodoPaymentId === data.payment_id) {
        console.log(`[DODO_WEBHOOK] Duplicate delivery for payment ${data.payment_id}, skipping`);
        return NextResponse.json({ success: true, duplicate: true });
      }

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
      const userId = await resolveUserId(data);
      if (userId) {
        await db
          .update(userSubscriptions)
          .set({
            status: eventType === "subscription.cancelled" ? "cancelled" : "expired",
            // For cancellations, we keep the end date as is so the user keeps
            // access until the period ends (Dodo behavior). checkSubscription
            // honours a future end date for "cancelled".
          })
          .where(eq(userSubscriptions.userId, userId));
      }
    } else if (eventType === "payment.failed" || eventType === "subscription.failed") {
      const userId = await resolveUserId(data);
      if (userId) {
        await db
          .update(userSubscriptions)
          .set({ status: "failed" })
          .where(eq(userSubscriptions.userId, userId));
      }
    }

    // Record only after processing succeeded, so a mid-handler failure returns
    // 500 and lets Dodo retry rather than being suppressed as a duplicate.
    if (webhookId) {
      await db
        .insert(processedWebhookEvents)
        .values({ id: webhookId, eventType })
        .onConflictDoNothing();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DODO_WEBHOOK_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Resolve the local userId for a webhook payload: prefer the checkout metadata,
// otherwise match an existing subscription row by Dodo subscription/customer id.
async function resolveUserId(data: any): Promise<string | undefined> {
  if (data.metadata?.userId) return data.metadata.userId as string;

  const conditions = [];
  if (data.subscription_id) conditions.push(eq(userSubscriptions.dodoSubscriptionId, data.subscription_id));
  if (data.customer_id) conditions.push(eq(userSubscriptions.dodoCustomerId, data.customer_id));
  if (conditions.length === 0) return undefined;

  const rows = await db
    .select()
    .from(userSubscriptions)
    .where(conditions.length === 1 ? conditions[0] : or(...conditions))
    .limit(1);
  return rows[0]?.userId;
}

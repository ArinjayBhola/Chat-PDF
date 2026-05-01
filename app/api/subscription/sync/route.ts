import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { dodo } from "@/lib/dodopayments";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");

    // FOR TESTING/DEV: If we have payment info in the URL, trust it to update the DB immediately
    // In production, we still verify with the Dodo API for security.
    if (paymentId && status === "succeeded" && process.env.NODE_ENV !== "production") {
      const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db
        .insert(userSubscriptions)
        .values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          dodoPaymentId: paymentId,
          subscriptionEndDate: subscriptionEndDate,
          status: "active",
        })
        .onConflictDoUpdate({
          target: userSubscriptions.userId,
          set: {
            dodoPaymentId: paymentId,
            subscriptionEndDate: subscriptionEndDate,
            status: "active",
          },
        });
      return NextResponse.json({ success: true, status: "active", source: "params" });
    }

    // 1. Find the customer ID by email
    const customers = await dodo.customers.list({
      email: session.user.email,
    });

    if (!customers.items || customers.items.length === 0) {
      return NextResponse.json({ success: false, message: "No customer found with this email" });
    }

    const customerId = customers.items[0].customer_id;

    // 2. Search for the latest successful payment for this customer
    const payments = await dodo.payments.list({
      customer_id: customerId,
      page_size: 1,
    });

    if (payments.items && payments.items.length > 0) {
      const lastPayment = payments.items[0];
      
      if (lastPayment.status === "succeeded") {
        const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db
          .insert(userSubscriptions)
          .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            dodoPaymentId: lastPayment.payment_id,
            dodoCustomerId: lastPayment.customer.customer_id,
            subscriptionEndDate: subscriptionEndDate,
            status: "active",
          })
          .onConflictDoUpdate({
            target: userSubscriptions.userId,
            set: {
              dodoPaymentId: lastPayment.payment_id,
              dodoCustomerId: lastPayment.customer.customer_id,
              subscriptionEndDate: subscriptionEndDate,
              status: "active",
            },
          });

        return NextResponse.json({ success: true, status: "active" });
      }
    }

    // 3. Also check subscriptions for this customer
    const subscriptions = await dodo.subscriptions.list({
      customer_id: customerId,
      page_size: 1,
    });

    if (subscriptions.items && subscriptions.items.length > 0) {
      const lastSub = subscriptions.items[0];
      
      if (lastSub.status === "active") {
        const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db
          .insert(userSubscriptions)
          .values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            dodoSubscriptionId: lastSub.subscription_id,
            dodoCustomerId: lastSub.customer.customer_id,
            subscriptionEndDate: subscriptionEndDate,
            status: "active",
          })
          .onConflictDoUpdate({
            target: userSubscriptions.userId,
            set: {
              dodoSubscriptionId: lastSub.subscription_id,
              dodoCustomerId: lastSub.customer.customer_id,
              subscriptionEndDate: subscriptionEndDate,
              status: "active",
            },
          });

        return NextResponse.json({ success: true, status: "active" });
      }
    }

    return NextResponse.json({ success: false, message: "No active subscription found" });
  } catch (error) {
    console.error("[SUBSCRIPTION_SYNC_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

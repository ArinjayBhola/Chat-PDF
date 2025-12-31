import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("x-razorpay-signature") as string;

  console.log("WEBHOOK_DEBUG: signature", signature);
  console.log("WEBHOOK_DEBUG: body", body);

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  if (!secret) {
    console.log("WEBHOOK_DEBUG: RAZORPAY_WEBHOOK_SECRET is not set");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret || "")
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.log("WEBHOOK_DEBUG: signature mismatch");
    return new NextResponse("invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  console.log("WEBHOOK_DEBUG: event", event.event);

  // Handle payment.captured or payment_link.paid
  if (event.event === "payment_link.paid") {
    const paymentLink = event.payload.payment_link.entity;
    const userId = paymentLink.notes.userId;

    if (!userId) {
      return new NextResponse("no user id in notes", { status: 400 });
    }

    await db.insert(userSubscriptions).values({
        id: crypto.randomUUID(),
        userId: userId,
        razorpayCustomerId: paymentLink.customer.id || "dummy_cust_id", // Razorpay might not always provide customer id in payment link payload
        razorpayPriceId: "pro_plan", // Dummy price id for tracking
        razorpayCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }).onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
            razorpayCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
    });
  }

  return new NextResponse(null, { status: 200 });
}

import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const callback_url = `${baseUrl}/api/payment-callback`;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user.id))
      .limit(1);

    if (
      existingSubscription[0] &&
      existingSubscription[0].razorpayPaymentId &&
      existingSubscription[0].subscriptionEndDate &&
      existingSubscription[0].subscriptionEndDate.getTime() > Date.now()
    ) {
      return new NextResponse("Already subscribed", { status: 400 });
    }

    const amount = 99900; // Rs 999 in paise

    const paymentLink: any = await razorpay.paymentLink.create({
      amount: amount,
      currency: "INR",
      accept_partial: false,
      description: "ChatPDF Pro Subscription",
      customer: {
        name: session.user.name || "Customer",
        email: session.user.email || "",
      },
      notify: {
        sms: false,
        email: true,
      },
      reminder_enable: true,
      notes: {
        userId: session.user.id,
      },
      callback_url: callback_url,
      callback_method: "get",
    });

    return NextResponse.json({ url: paymentLink.short_url });
  } catch (error) {
    console.log("[RAZORPAY_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

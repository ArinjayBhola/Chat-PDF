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
  const return_url = (process.env.NEXT_PUBLIC_APP_URL || origin) + "/";

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const _userSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user.id));

    if (_userSubscriptions[0] && _userSubscriptions[0].razorpayCustomerId) {
       // Ideally here you'd redirect to a customer portal or something similar if Razorpay supported it directly for subscriptions.
       // For this simple implementation, we'll just return the payment link flow.
    }

    // Create a Razorpay checkout session (using Payment Links or Subscriptions API)
    // Here we'll use a Payment Link for simplicity, but for real SaaS you'd use the Subscriptions API.
    // Assuming a fixed price for "Pro"
    const amount = 99900; // Rs 999 in paise

    const paymentLink: any = await razorpay.paymentLink.create({
        amount: amount,
        currency: "INR",
        accept_partial: false,
        description: "ChatPDF Pro Subscription",
        customer: {
            name: session.user.name || "Customer",
            email: session.user.email || "",
            contact: "+919876543210" // Valid contact format
        },
        notify: {
            sms: true,
            email: true
        },
        reminder_enable: true,
        notes: {
            userId: session.user.id
        },
        callback_url: return_url,
        callback_method: "get"
    });

    return NextResponse.json({ url: paymentLink.short_url });

  } catch (error) {
    console.log("[RAZORPAY_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

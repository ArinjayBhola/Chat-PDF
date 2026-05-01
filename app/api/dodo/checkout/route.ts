import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { dodo } from "@/lib/dodopayments";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || "p_placeholder";

    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        name: session.user.name || "Customer",
        email: session.user.email || "",
      },
      metadata: {
        userId: String(session.user.id),
      },
    });

    return NextResponse.json({ url: checkoutSession.checkout_url });
  } catch (error) {
    console.error("[DODO_CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

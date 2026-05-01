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

    if (!process.env.DODO_PAYMENTS_API_KEY) {
      console.error("[DODO_CHECKOUT_ERROR] DODO_PAYMENTS_API_KEY is not set");
      return new NextResponse("Dodo Payments API Key is missing in environment variables", { status: 500 });
    }

    const productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID;
    
    if (!productId || productId === "p_placeholder") {
      console.error("[DODO_CHECKOUT_ERROR] Invalid or missing NEXT_PUBLIC_DODO_PRODUCT_ID");
      return new NextResponse("Invalid Product ID configuration", { status: 500 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        name: session.user.name || "Customer",
        email: session.user.email || "",
      },
      metadata: {
        userId: String(session.user.id),
      },
      return_url: `${baseUrl}?payment=success`,
    });

    if (!checkoutSession.checkout_url) {
      console.error("[DODO_CHECKOUT_ERROR] No checkout URL returned", checkoutSession);
      return new NextResponse("Failed to create checkout URL", { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.checkout_url });
  } catch (error: any) {
    console.error("[DODO_CHECKOUT_ERROR] Full error:", error);
    
    // Log specific details if available from the Dodo SDK
    if (error.response) {
      console.error("[DODO_API_RESPONSE_ERROR]", error.response.data);
    }

    return new NextResponse(
      error.message || "Internal Error", 
      { status: 500 }
    );
  }
}

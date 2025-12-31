"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

type Props = {
  userId: string;
  searchParams: Record<string, string | string[] | undefined>;
};

export default function PaymentSuccessHandler({ userId, searchParams }: Props) {
  useEffect(() => {
    if (searchParams.razorpay_payment_link_status === "paid") {
      fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolvedSearchParams: searchParams,
          userId,
        }),
      })
        .then(() => toast.success("Subscription activated successfully!"))
        .catch(() => toast.error("Failed to activate subscription."));
    }
  }, [searchParams, userId]);

  return null;
}

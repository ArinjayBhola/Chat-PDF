"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  paymentStatus: string;
};

export default function PaymentSuccessHandler({ paymentStatus }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (paymentStatus === "success") {
      toast.success("Subscription activated! Refreshing...");
      router.replace("/");
    } else if (paymentStatus === "unauthorized") {
      toast.error("Please sign in to complete payment.");
    } else if (paymentStatus === "invalid_signature") {
      toast.error("Payment verification failed. Please contact support.");
    } else if (paymentStatus === "not_paid") {
      toast.error("Payment was not completed.");
    } else if (paymentStatus === "db_error") {
      toast.error("Failed to activate subscription. Please contact support.");
    } else if (paymentStatus === "config_error") {
      toast.error("Payment configuration error. Please contact admin.");
    } else if (paymentStatus === "missing_params") {
      toast.error("Invalid payment response. Please try again.");
    }
  }, [paymentStatus, router]);

  return null;
}

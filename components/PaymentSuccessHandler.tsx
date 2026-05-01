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
    const syncSubscription = async () => {
      try {
        if (paymentStatus === "success") {
          toast.loading("Activating your Pro plan...", { id: "syncing" });
          
          // Get additional params from URL
          const urlParams = new URLSearchParams(window.location.search);
          const paymentId = urlParams.get("payment_id");
          const status = urlParams.get("status");

          // Force a sync with Dodo Payments API
          // We pass the params so that in dev mode it can update immediately
          const response = await fetch(`/api/subscription/sync?payment_id=${paymentId}&status=${status}`);
          const data = await response.json();

          if (data.success) {
            toast.success("Pro plan activated! Enjoy unlimited uploads.", { id: "syncing" });
          } else {
            // Webhook might still be processing, but we tried sync
            toast.success("Payment successful! Updating your status...", { id: "syncing" });
          }
          
          router.replace("/");
          router.refresh(); // Force refresh to update UI components
        }
      } catch (error) {
        console.error("Sync error:", error);
        toast.error("Payment successful, but status update is pending. Please refresh in a moment.", { id: "syncing" });
        router.replace("/");
      }
    };

    if (paymentStatus === "success") {
      syncSubscription();
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

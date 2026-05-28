// UI REDESIGN
"use client";
import React from "react";
import { Button } from "./ui/button";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { useGlobalLoading } from "./Provider";

const UpgradeButton = ({ isPro }: { isPro: boolean }) => {
  const { isGlobalLoading, setIsGlobalLoading } = useGlobalLoading();

  const handleUpgrade = async () => {
    try {
      setIsGlobalLoading(true);
      const { data } = await axios.get("/api/dodo/checkout");
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Unable to create checkout session.");
        setIsGlobalLoading(false);
      }
    } catch (error) {
      console.error(error);
      const axiosError = error as AxiosError<string>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data;

      if (status === 400 && message === "Already subscribed") {
        toast.error("You already have an active Pro plan.");
      } else if (status === 401) {
        toast.error("Please sign in to continue.");
      } else {
        // Show specific error from server if available, otherwise fallback
        toast.error(typeof message === 'string' ? message : "Unable to start payment. Please try again.");
      }
      setIsGlobalLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isPro}
      className={`w-full ${
        isPro
          ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 opacity-90 cursor-default"
          : "bg-primary hover:bg-primary/95 shadow-sm hover:shadow active:scale-[0.98]"
      } text-primary-foreground border-0 transition-all duration-200 h-10 rounded-lg justify-center font-semibold`}>
      {isPro ? "Pro Plan Active" : "Upgrade to Pro"}
    </Button>
  );
};

export default UpgradeButton;

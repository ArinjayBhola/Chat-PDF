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
        toast.error("Unable to start payment. Please try again.");
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
          ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          : "bg-primary hover:bg-primary/90"
      } text-primary-foreground border-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] h-10 rounded-lg justify-center font-bold shadow-md`}>
      {isPro ? "Pro Plan Active" : "Upgrade to Pro"}
    </Button>
  );
};

export default UpgradeButton;

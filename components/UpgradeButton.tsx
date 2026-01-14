"use client";
import React from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useGlobalLoading } from "./Provider";

const UpgradeButton = ({ isPro }: { isPro: boolean }) => {
  const { isGlobalLoading, setIsGlobalLoading } = useGlobalLoading();

  const handleUpgrade = async () => {
    try {
      setIsGlobalLoading(true);
      const response = await axios.get("/api/razorpay");
      window.location.href = response.data.url;
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setIsGlobalLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isPro}
      className={`w-full ${
        isPro
          ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          : "bg-purple-600 hover:bg-purple-700 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 dark:font-extrabold"
      } text-white border-none transition-all hover:scale-[1.02] active:scale-[0.98] h-10 rounded-lg justify-center font-bold`}>
      {isPro ? "Pro Plan Active" : "Upgrade to Pro"}
    </Button>
  );
};

export default UpgradeButton;

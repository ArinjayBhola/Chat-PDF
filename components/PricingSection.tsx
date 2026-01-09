"use client";
import React from "react";
import { Button } from "./ui/button";
import { FaCheck } from "react-icons/fa";
import UpgradeButton from "./UpgradeButton";

const PricingSection = ({ isPro }: { isPro: boolean }) => {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-slate-600 dark:text-slate-400">
          Unlock the full power of PDF Chat AI with our premium plan.
        </p>
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-4xl w-full">
            {/* Free Plan */}
            <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-800 p-8 ring-1 ring-slate-200 dark:ring-slate-700 xl:p-10 shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md dark:hover:shadow-lg">
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-slate-900 dark:text-slate-100">Free</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Perfect for trying out PDF Chat AI.
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">₹0</span>
                  <span className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">/mo</span>
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-blue-600 dark:text-blue-400" />3 PDF uploads
                  </li>
                  <li className="flex gap-x-3 text-slate-400 dark:text-slate-600 line-through">
                    <FaCheck className="h-6 w-5 flex-none text-slate-300 dark:text-slate-700" />
                    Unlimited PDF uploads
                  </li>
                  <li className="flex gap-x-3 text-slate-400 dark:text-slate-600 line-through">
                    <FaCheck className="h-6 w-5 flex-none text-slate-300 dark:text-slate-700" />
                    Priority support
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-8 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
                disabled>
                Current Plan
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-700 p-8 ring-1 ring-slate-900 dark:ring-blue-500 xl:p-10 shadow-xl relative overflow-hidden transition-all hover:scale-[1.01] dark:hover:scale-[1.02]">
              <div className="absolute top-0 right-0 p-3 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                Popular
              </div>
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-white">Pro</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-200 dark:text-blue-50">
                  Unlimited access for professionals.
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">₹999</span>
                  <span className="text-sm font-semibold leading-6 text-slate-200 dark:text-blue-50">/mo</span>
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-slate-200 dark:text-blue-50">
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-blue-300 dark:text-white" />
                    Unlimited PDF uploads
                  </li>
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-blue-300 dark:text-white" />
                    Faster response times
                  </li>
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-blue-300 dark:text-white" />
                    Priority support
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <UpgradeButton isPro={isPro} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;

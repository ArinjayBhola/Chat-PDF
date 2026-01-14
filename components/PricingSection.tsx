"use client";
import React from "react";
import { Button } from "./ui/button";
import { FaCheck } from "react-icons/fa";
import UpgradeButton from "./UpgradeButton";

const PricingSection = ({ isPro }: { isPro: boolean }) => {
  return (
    <div className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">Pricing</h2>
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
            <div className="flex flex-col justify-between rounded-3xl bg-white/70 dark:bg-slate-900/50 p-8 ring-1 ring-slate-200 dark:ring-slate-800 xl:p-10 shadow-lg border border-slate-200 dark:border-slate-800 backdrop-blur-sm transition-all hover:scale-[1.02] duration-300">
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-xl font-semibold leading-8 text-slate-900 dark:text-slate-100">Free</h3>
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
                    <FaCheck className="h-6 w-5 flex-none text-indigo-600 dark:text-indigo-400" />3 PDF uploads
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
                className="mt-8 w-full border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled>
                Current Plan
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative flex flex-col justify-between rounded-3xl bg-slate-900 dark:bg-slate-900 p-8 ring-1 ring-slate-900 dark:ring-slate-700 xl:p-10 shadow-2xl transition-all hover:scale-[1.02] duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-900/40 dark:to-purple-900/40 opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 p-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl z-10 shadow-md">
                Popular
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-xl font-semibold leading-8 text-white">Pro</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Unlimited access for professionals.
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">₹999</span>
                  <span className="text-sm font-semibold leading-6 text-slate-300">/ 1 month</span>
                </p>
                <div className="mt-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">
                  Automatic expiration after 30 days
                </div>

                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-indigo-400" />
                    <span className="text-white">Unlimited PDF uploads</span>
                  </li>
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-indigo-400" />
                    <span className="text-white">Faster response times</span>
                  </li>
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-indigo-400" />
                    <span className="text-white">Priority support</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 relative z-10">
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

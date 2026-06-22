// UI REDESIGN
"use client";
import React from "react";
import { Button } from "./ui/button";
import { FaCheck } from "react-icons/fa";
import UpgradeButton from "./UpgradeButton";

const PricingSection = ({ isPro }: { isPro: boolean }) => {
  return (
    <div className="py-24 sm:py-32 bg-muted/20 border-t border-border transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-sm font-bold tracking-wider uppercase text-primary mb-2">Pricing</h2>
          <p className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
          Unlock the full power of ChatDoc AI with our premium plan.
        </p>
        
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-4xl w-full">
            {/* Free Plan */}
            <div className="flex flex-col justify-between rounded-2xl bg-card p-8 border border-border shadow-sm transition-all hover:translate-y-[-2px] duration-300">
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-xl font-bold leading-8 text-foreground">Free</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Perfect for trying out ChatDoc AI.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">₹0</span>
                  <span className="text-sm font-semibold leading-6 text-muted-foreground">/mo</span>
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-x-3 items-center">
                    <FaCheck className="h-4 w-4 flex-none text-primary" />
                    <span>3 document uploads</span>
                  </li>
                  <li className="flex gap-x-3 items-center text-muted-foreground/40 line-through">
                    <FaCheck className="h-4 w-4 flex-none text-muted-foreground/20" />
                    <span>Unlimited document uploads</span>
                  </li>
                  <li className="flex gap-x-3 items-center text-muted-foreground/40 line-through">
                    <FaCheck className="h-4 w-4 flex-none text-muted-foreground/20" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-8 w-full font-semibold h-10 cursor-not-allowed opacity-60"
                disabled>
                Current Plan
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative flex flex-col justify-between rounded-2xl bg-card p-8 border-2 border-primary shadow-md transition-all hover:translate-y-[-2px] duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-bl-lg shadow-sm">
                Popular
              </div>

              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-xl font-bold leading-8 text-foreground">Pro</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Unlimited access for professionals.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">₹999</span>
                  <span className="text-sm font-semibold leading-6 text-muted-foreground">/ 1 month</span>
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded inline-block">
                  Automatic expiration after 30 days
                </div>

                <ul
                  role="list"
                  className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-x-3 items-center">
                    <FaCheck className="h-4 w-4 flex-none text-primary" />
                    <span className="text-foreground font-medium">Unlimited document uploads</span>
                  </li>
                  <li className="flex gap-x-3 items-center">
                    <FaCheck className="h-4 w-4 flex-none text-primary" />
                    <span className="text-foreground font-medium">Faster response times</span>
                  </li>
                  <li className="flex gap-x-3 items-center">
                    <FaCheck className="h-4 w-4 flex-none text-primary" />
                    <span className="text-foreground font-medium">Priority support</span>
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

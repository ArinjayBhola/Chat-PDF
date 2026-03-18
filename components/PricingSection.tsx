"use client";
import React from "react";
import { Button } from "./ui/button";
import { FaCheck } from "react-icons/fa";
import UpgradeButton from "./UpgradeButton";

const PricingSection = ({ isPro }: { isPro: boolean }) => {
  return (
    <div className="py-24 sm:py-32 bg-muted/30 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
          Unlock the full power of ChatDoc AI with our premium plan.
        </p>
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-4xl w-full">
            {/* Free Plan */}
            <div className="flex flex-col justify-between rounded-3xl bg-card/70 p-8 ring-1 ring-border xl:p-10 shadow-lg border border-border backdrop-blur-sm transition-all hover:scale-[1.02] duration-300">
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-xl font-semibold leading-8 text-foreground">Free</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Perfect for trying out ChatDoc AI.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">₹0</span>
                  <span className="text-sm font-semibold leading-6 text-muted-foreground">/mo</span>
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-primary" />3 document uploads
                  </li>
                  <li className="flex gap-x-3 text-muted-foreground/50 line-through">
                    <FaCheck className="h-6 w-5 flex-none text-muted-foreground/30" />
                    Unlimited document uploads
                  </li>
                  <li className="flex gap-x-3 text-muted-foreground/50 line-through">
                    <FaCheck className="h-6 w-5 flex-none text-muted-foreground/30" />
                    Priority support
                  </li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="mt-8 w-full border-border text-foreground hover:bg-muted transition-colors"
                disabled>
                Current Plan
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative flex flex-col justify-between rounded-3xl bg-foreground p-8 ring-1 ring-foreground xl:p-10 shadow-2xl transition-all hover:scale-[1.02] duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 p-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-bl-xl z-10 shadow-md">
                Popular
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-xl font-semibold leading-8 text-background">Pro</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-background/70">Unlimited access for professionals.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-background">₹999</span>
                  <span className="text-sm font-semibold leading-6 text-background/70">/ 1 month</span>
                </p>
                <div className="mt-2 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded inline-block">
                  Automatic expiration after 30 days
                </div>

                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-background/80">
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-primary" />
                    <span className="text-background">Unlimited document uploads</span>
                  </li>
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-primary" />
                    <span className="text-background">Faster response times</span>
                  </li>
                  <li className="flex gap-x-3">
                    <FaCheck className="h-6 w-5 flex-none text-primary" />
                    <span className="text-background">Priority support</span>
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

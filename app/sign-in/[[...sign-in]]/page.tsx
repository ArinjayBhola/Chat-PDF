"use client";

import Link from "next/link";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    // Fixed height and hidden overflow absolutely prevents scrollbars
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 font-sans">
      
      {/* LEFT PANEL - Solid dark slate, uniform with Sign Up */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary text-primary-foreground">
        
        <Link href="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition">
          <span className="text-2xl font-bold tracking-tight">Docs Chat.ai</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Chat with your Documents at the speed of thought.
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
            Extract insights, summarize files, and find answers instantly using advanced AI.
          </p>
          <div className="inline-block px-4 py-2 bg-black/20 rounded-full text-sm font-medium text-white/90">
            Welcome back to your workspace
          </div>
        </div>

        <div className="text-sm text-primary-foreground/60">
        </div>
      </div>

      {/* RIGHT PANEL - Form centered with optimized vertical spacing */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-background text-foreground">
        <SignInForm />
      </div>
    </div>
  );
}
"use client";

import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";

export default function SignUpPage() {
  return (
    // Fixed height and hidden overflow absolutely prevents scrollbars
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 font-sans">
      
      {/* LEFT PANEL - Solid dark slate, no gradient */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary text-primary-foreground">
        
        <Link href="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition">
          <span className="text-2xl font-bold tracking-tight">Docs Chat.ai</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Chat with any Document in seconds.
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
            Upload a file. Ask questions. Get instant answers. No more scrolling through hundreds of pages.
          </p>
          <div className="inline-block px-4 py-2 bg-black/20 rounded-full text-sm font-medium text-white/90">
            Trusted by students, researchers & professionals
          </div>
        </div>

        <div className="text-sm text-primary-foreground/60">
        </div>
      </div>

      {/* RIGHT PANEL - Form centered with optimized vertical spacing */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-background text-foreground">
        <SignUpForm />
      </div>
    </div>
  );
}
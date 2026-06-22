// UI REDESIGN
"use client";

import SignUpForm from "@/components/auth/SignUpForm";
import Link from "next/link";
import { LuFileText } from "react-icons/lu";

export default function SignUpPage() {
  return (
    // Fixed height and hidden overflow absolutely prevents scrollbars
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">

      {/* LEFT PANEL - Solid indigo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary text-primary-foreground">

        <Link href="/" className="flex items-center gap-2.5 w-fit transition-transform duration-200 active:scale-95">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <LuFileText className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight select-none">DocsChat</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Chat with any Document in seconds.
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
            Upload a file. Ask questions. Get instant answers. No more scrolling through hundreds of pages.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            Trusted by students, researchers &amp; professionals
          </div>
        </div>

        <div className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} DocsChat
        </div>
      </div>

      {/* RIGHT PANEL - Form centered with optimized vertical spacing */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-background text-foreground">
        <SignUpForm />
      </div>
    </div>
  );
}
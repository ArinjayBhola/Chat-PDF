"use client";

import Link from "next/link";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    // Fixed height and hidden overflow absolutely prevents scrollbars
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 font-sans">
      
      {/* LEFT PANEL - Solid dark slate, uniform with Sign Up */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-900 text-white">
        
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="flex h-10 w-10 items-center justify-center bg-indigo-500 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">ChatPDF</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Chat with your PDFs at the speed of thought.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Extract insights, summarize documents, and find answers instantly using advanced AI.
          </p>
          <div className="inline-block px-4 py-2 bg-slate-800 rounded-full text-sm font-medium text-slate-300">
            Welcome back to your workspace
          </div>
        </div>

        <div className="text-sm text-slate-500">
        </div>
      </div>

      {/* RIGHT PANEL - Form centered with optimized vertical spacing */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-slate-50 dark:bg-slate-950">
        <SignInForm />
      </div>
    </div>
  );
}
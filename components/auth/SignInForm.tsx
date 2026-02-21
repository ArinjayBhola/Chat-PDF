"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const resetSuccess = searchParams?.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      {/* Mobile Logo */}
      <div className="lg:hidden mb-8 flex justify-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-indigo-500 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ChatPDF</span>
        </div>
      </div>

      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Welcome back
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Please enter your details to sign in.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg mb-6">
          Password successfully reset. You can now log in.
        </div>
      )}

      {/* GOOGLE BUTTON */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg mb-6"
      >
        <FaGoogle className="mr-2 w-4 h-4 text-slate-600 dark:text-slate-400" />
        Sign in with Google
      </Button>

      {/* DIVIDER */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="px-3 text-xs uppercase font-semibold text-slate-400">Or email</span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      {/* FORM */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Email address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 pr-10"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in...
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{" "}
        <Link
          href="/sign-up"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          Sign up
        </Link>
      </p>

    </div>
  );
}

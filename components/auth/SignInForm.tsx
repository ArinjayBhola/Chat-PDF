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
          <span className="text-2xl font-bold text-foreground tracking-tight">Docs Chat.ai</span>
        </div>
      </div>

      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Welcome back
        </h2>
        <p className="text-muted-foreground text-sm">
          Please enter your details to sign in.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 text-sm text-primary bg-primary/10 border border-primary/20 rounded-lg mb-6 shadow-sm">
          Password successfully reset. You can now log in.
        </div>
      )}

      {/* GOOGLE BUTTON */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full h-11 bg-card border-border text-foreground hover:bg-muted font-medium rounded-lg mb-6 shadow-sm"
      >
        <FaGoogle className="mr-2 w-4 h-4 text-muted-foreground" />
        Sign in with Google
      </Button>

      {/* DIVIDER */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-border"></div>
        <span className="px-3 text-xs uppercase font-semibold text-muted-foreground">Or email</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* FORM */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pr-10"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin text-primary-foreground" viewBox="0 0 24 24">
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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/sign-up"
          className="text-primary hover:text-primary/80 transition font-medium"
        >
          Sign up
        </Link>
      </p>

    </div>
  );
}

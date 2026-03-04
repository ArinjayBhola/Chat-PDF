"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

export default function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      await axios.post("/api/auth/signup", { name, email, password });
      setStep(2); // Proceed to OTP step
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!otp || otp.length < 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }

      await axios.post("/api/auth/verify-otp", { name, email, password, otp });

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      <div className="lg:hidden mb-8 flex justify-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground tracking-tight">Docs Chat.ai</span>
        </div>
      </div>

      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Create an account
        </h2>
        <p className="text-muted-foreground text-sm">
          Start analyzing documents instantly.
        </p>
      </div>

      {/* GOOGLE BUTTON */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full h-11 bg-card border-border text-foreground hover:bg-muted font-medium rounded-lg mb-6 shadow-sm"
      >
        <FaGoogle className="mr-2 w-4 h-4 text-muted-foreground" />
        Continue with Google
      </Button>

      {/* DIVIDER */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-border"></div>
        <span className="px-3 text-xs uppercase font-semibold text-muted-foreground">Or email</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* FORM */}
      {step === 1 ? (
        <form onSubmit={handleCredentialsSignUp} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Full Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              placeholder="Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition"
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
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
                Creating account...
              </div>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4">
            <p className="text-sm text-primary">
              We sent a code to <span className="font-semibold">{email}</span>.
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Verification Code
            </label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
            />
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
                Verifying...
              </div>
            ) : (
              "Verify & Complete Setup"
            )}
          </Button>
          
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground mt-4 transition"
          >
            Back to sign up
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-primary hover:text-primary/80 transition font-medium"
        >
          Sign in
        </Link>
      </p>

    </div>
  );
}

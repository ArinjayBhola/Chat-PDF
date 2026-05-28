// UI REDESIGN
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      setSuccess(res.data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await axios.post("/api/auth/reset-password", { email, otp, newPassword });
      router.push("/sign-in?reset=success");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      {/* Mobile Logo */}
      <div className="lg:hidden mb-8 flex justify-center">
        <Link href="/" className="flex items-center gap-2 transition-transform duration-200 active:scale-95">
          <span className="text-2xl font-extrabold text-foreground tracking-tight select-none">
            <span className="text-primary">Docs</span>Chat.ai
          </span>
        </Link>
      </div>

      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Reset Password
        </h2>
        <p className="text-muted-foreground text-sm">
          {step === 1 ? "Enter your email to receive a secure code." : "Enter your reset code and new password."}
        </p>
      </div>

      {/* FORM */}
      {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">

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
              className="h-11 rounded-lg bg-background border-border transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              placeholder="name@example.com"
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
                Sending code...
              </div>
            ) : (
              "Send Reset Code"
            )}
          </Button>

          <div className="mt-4 text-center">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">

        {success && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4 animate-in fade-in duration-300">
            <p className="text-sm text-primary font-medium">
              {success}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Reset Code
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

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            Confirm New Password
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
              Resetting...
            </div>
          ) : (
            "Save New Password"
          )}
        </Button>

        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full text-sm font-medium text-muted-foreground hover:text-foreground mt-4 transition"
        >
          I need a new code
        </button>
      </form>
      )}

    </div>
  );
}

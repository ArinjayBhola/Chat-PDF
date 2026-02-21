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
      // Because we return 404 in the API for a missing email, err.response.data.error intercepts it properly, remaining on step 1!
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
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-indigo-500 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ChatPDF</span>
        </Link>
      </div>

      <div className="mb-6 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Reset Password
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {step === 1 ? "Enter your email to receive a secure code." : "Enter your reset code and new password."}
        </p>
      </div>

      {/* FORM */}
      {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">

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
              className="h-11 rounded-lg bg-white dark:bg-slate-900 border-slate-200 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              placeholder="name@example.com"
            />
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
                Sending code...
              </div>
            ) : (
              "Send Reset Code"
            )}
          </Button>

          <div className="mt-4 text-center">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">

        {success && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg mb-4">
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              {success}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Reset Code
          </label>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="h-11 rounded-lg bg-white dark:bg-slate-900 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 text-center text-2xl tracking-[0.5em] font-mono"
            placeholder="000000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-lg bg-white dark:bg-slate-900 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 pr-10"
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

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 rounded-lg bg-white dark:bg-slate-900 transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              tabIndex={-1}
            >
              {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
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
              Resetting...
            </div>
          ) : (
            "Save New Password"
          )}
        </Button>
        
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mt-4 transition"
        >
          I need a new code
        </button>
      </form>
      )}

    </div>
  );
}

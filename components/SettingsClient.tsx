"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { usePreferences } from "./providers/PreferencesContext";
import { useTheme } from "next-themes";
import UpgradeButton from "./UpgradeButton";
import { Button } from "./ui/button";
import { FiLoader } from "react-icons/fi";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  email: string;
  isPro: boolean;
  expiryDate: Date | null;
  chatCount: number;
};

export default function SettingsClient({ email, isPro, expiryDate, chatCount }: Props) {
  const router = useRouter();

  const formatDateWithOrdinal = (dateString: string | Date) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const suffix = ["th", "st", "nd", "rd"][((day % 10) > 3 ? 0 : (day % 100) - (day % 10) !== 10 ? day % 10 : 0)];
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  };
  const [activeTab, setActiveTab] = useState<"account" | "interface" | "subscription">("account");
  const { interfaceSize, setInterfaceSize, themeColor, setThemeColor } = usePreferences();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleResetPasswordOTP = async () => {
    try {
      setIsLoading(true);
      await axios.post("/api/auth/forgot-password", { email });
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    try {
      setIsLoading(true);
      await axios.post("/api/auth/reset-password", { email, otp, newPassword });
      toast.success("Password reset successfully. Please log in again.");
      setOtp("");
      setNewPassword("");
      setOtpSent(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await axios.delete("/api/auth/delete-account");
      toast.success("Account deleted successfully");
      router.push("/sign-up");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 text-foreground items-start">
        {/* Sidebar Navigation */}
      <div className="w-full md:w-72 space-y-3 pr-2 md:pr-6 shrink-0">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("account")}
            className={cn(
              "w-full text-left px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 border",
              activeTab === "account" 
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                : "bg-card text-foreground border-border hover:bg-muted/80 hover:border-muted-foreground/30"
            )}
          >
            Account Management
          </button>
          <button
            onClick={() => setActiveTab("interface")}
            className={cn(
              "w-full text-left px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 border",
              activeTab === "interface" 
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                : "bg-card text-foreground border-border hover:bg-muted/80 hover:border-muted-foreground/30"
            )}
          >
            Interface Preferences
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={cn(
              "w-full text-left px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 border",
              activeTab === "subscription" 
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]" 
                : "bg-card text-foreground border-border hover:bg-muted/80 hover:border-muted-foreground/30"
            )}
          >
            Subscription Details
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-card shadow-sm border border-border rounded-2xl p-6 md:p-8">
        
        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-xl font-bold mb-4">Reset Password</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Change your password securely using an OTP sent to <span className="font-medium text-foreground">{email}</span>.
              </p>

              {!otpSent ? (
                <Button onClick={handleResetPasswordOTP} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  Send OTP to Email
                </Button>
              ) : (
                <div className="space-y-4 max-w-sm bg-muted/30 p-4 rounded-xl border border-border">
                  <div>
                    <label className="text-sm font-medium mb-1 block">OTP Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <Button onClick={handleResetPasswordSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
                    {isLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm Password Reset
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold text-destructive mb-4">Danger Zone</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Permanently delete your account and all associated AI chats. This action cannot be undone.
              </p>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive font-bold">Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="mb-2 text-sm text-foreground font-medium">Please type <span className="font-bold">DELETE</span> to confirm.</p>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-destructive outline-none"
                      placeholder="DELETE"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      disabled={isLoading || deleteInput.trim() !== "DELETE"} 
                      onClick={handleDeleteAccount}
                    >
                      {isLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                      Confirm Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Interface Preferences Tab */}
        {activeTab === "interface" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-xl font-bold mb-4">Display Size</h2>
              <p className="text-muted-foreground text-sm mb-6">Choose how compact or spacious the application feels.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setInterfaceSize("comfortable")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${interfaceSize === "comfortable" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <p className="font-semibold text-lg">Comfortable</p>
                  <p className="text-sm text-muted-foreground mt-1">Default padding and text size setup.</p>
                </button>
                <button
                  onClick={() => setInterfaceSize("compact")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${interfaceSize === "compact" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <p className="font-semibold text-base">Compact</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Smaller text, tighter spacing to fit more content.</p>
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold mb-4">Theme Color</h2>
              <p className="text-muted-foreground text-sm mb-6">Select your primary accent color for the platform.</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {["default", "orange", "amber", "rose"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setThemeColor(c as any)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${themeColor === c ? "border-primary bg-muted" : "border-border hover:bg-muted/50"}`}
                  >
                    <div className="w-6 h-6 rounded-full" style={{
                      backgroundColor: c === 'default' ? '#3b82f6' : c === 'orange' ? '#f97316' : c === 'amber' ? '#f59e0b' : '#f43f5e'
                    }} />
                    <span className="capitalize font-medium">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold mb-4">Light / Dark Mode</h2>
              <div className="flex gap-4">
                {["light", "dark", "system"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTheme(m)}
                    className={`px-4 py-2 rounded-lg border font-medium transition capitalize ${theme === m ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-muted"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold mb-4">Chat Appearance</h2>
              <p className="text-muted-foreground text-sm mb-6">Customize how chat bubbles look during your session.</p>
              <div className="flex gap-4">
                <button className="flex-1 p-4 rounded-xl border-2 border-primary bg-primary/10 transition-all text-left">
                  <div className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-2xl rounded-br-sm mb-3 text-sm">Hello, what can you do?</div>
                  <p className="font-semibold text-foreground">Modern</p>
                  <p className="text-xs text-muted-foreground mt-1">Rounded bubbles with a tail</p>
                </button>
                <button className="flex-1 p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left opacity-60 cursor-not-allowed">
                  <div className="w-full bg-muted text-foreground py-2 px-4 rounded-md mb-3 text-sm border border-border">Hello, what can you do?</div>
                  <p className="font-semibold text-foreground">Classic (Coming Soon)</p>
                  <p className="text-xs text-muted-foreground mt-1">Squared off professional style</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-xl font-bold mb-4">Subscription Overview</h2>
              <div className="bg-muted/30 border border-border rounded-xl p-6 flex flex-col gap-6">
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                    <p className="text-2xl font-bold">{isPro ? "Pro Plan" : "Free Plan"}</p>
                  </div>
                  {isPro && (
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">Active</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Chats Created</p>
                    <p className="text-lg font-semibold">{chatCount} <span className="text-muted-foreground text-sm font-normal">/ {isPro ? "Unlimited" : "3 limits"}</span></p>
                    {/* Visual Meter */}
                    {!isPro && (
                      <div className="w-full bg-border h-2 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full ${chatCount >= 3 ? "bg-destructive" : "bg-primary"}`} 
                          style={{ width: `${Math.min((chatCount / 3) * 100, 100)}%` }} 
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Expiry Date</p>
                    <p className="text-lg font-semibold">
                      {isPro && expiryDate ? formatDateWithOrdinal(expiryDate) : "No active subscription"}
                    </p>
                  </div>
                </div>

                {!isPro && (
                  <div className="pt-4 border-t border-border mt-2">
                    <p className="text-sm mb-4 text-muted-foreground">Unlock unlimited chat and premium context support.</p>
                    <UpgradeButton isPro={isPro} />
                  </div>
                )}
                {isPro && (
                    <div className="pt-4 border-t border-border mt-2">
                        <UpgradeButton isPro={isPro} />
                    </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

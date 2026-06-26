// UI REDESIGN
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
import { signOut } from "next-auth/react";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
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
  hasPassword: boolean;
};

export default function SettingsClient({ email, isPro, expiryDate, chatCount, hasPassword }: Props) {
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
  const { interfaceSize, setInterfaceSize, chatAppearance, setChatAppearance, typography, setTypography } = usePreferences();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const calculateProRataRefund = () => {
    if (!expiryDate) return { amount: 0, daysLeft: 0, percentage: 0 };
    const now = new Date();
    const endDate = new Date(expiryDate);
    const msLeft = endDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, msLeft / (1000 * 60 * 60 * 24));
    const percentage = (daysLeft / 30) * 100;
    const amount = (daysLeft / 30) * 9.99; // Using float for display
    return { 
      amount: Math.max(0, amount), 
      daysLeft: Math.floor(daysLeft), 
      percentage: Math.min(100, Math.max(0, percentage)) 
    };
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      await axios.post("/api/subscription/cancel");
      toast.success("Subscription cancelled. Refund initiated.");
      setIsCancelDialogOpen(false);
      router.refresh(); // Refresh to update isPro and expiryDate
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

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
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post("/api/auth/reset-password", { 
        email, 
        otp, 
        currentPassword, 
        newPassword,
        isChange: true
      });
      toast.success("Password changed successfully.");
      setOtp("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpSent(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await axios.delete("/api/auth/delete-account");
      toast.success("Account deleted successfully");
      await signOut({ callbackUrl: "/sign-up" });
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
              "w-full text-left px-5 py-3 rounded-lg font-semibold transition-all duration-200 border cursor-pointer",
              activeTab === "account" 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card text-foreground border-border hover:bg-muted/80 hover:border-muted-foreground/30"
            )}
          >
            Account Management
          </button>
          <button
            onClick={() => setActiveTab("interface")}
            className={cn(
              "w-full text-left px-5 py-3 rounded-lg font-semibold transition-all duration-200 border cursor-pointer",
              activeTab === "interface" 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card text-foreground border-border hover:bg-muted/80 hover:border-muted-foreground/30"
            )}
          >
            Interface Preferences
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={cn(
              "w-full text-left px-5 py-3 rounded-lg font-semibold transition-all duration-200 border cursor-pointer",
              activeTab === "subscription" 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
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
            {hasPassword ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Change Password</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Change your password securely using an OTP sent to <span className="font-medium text-foreground">{email}</span>.
              </p>

              {!otpSent ? (
                <Button onClick={handleResetPasswordOTP} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  Send OTP to Email
                </Button>
              ) : (
                <div className="space-y-4 max-w-sm bg-muted/30 p-4 rounded-lg border border-border">
                  <div>
                    <label className="text-sm font-medium mb-1 block">OTP Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full h-11 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none px-3 transition-all"
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium mb-1 block">Current Password</label>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-11 pr-10 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none px-3 transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute bottom-3 right-3 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium mb-1 block">New Password</label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 pr-10 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none px-3 transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute bottom-3 right-3 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 pr-10 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none px-3 transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute bottom-3 right-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <Button onClick={handleResetPasswordSubmit} disabled={isLoading || newPassword !== confirmPassword || !newPassword} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                    {isLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm Password Change
                  </Button>
                </div>
              )}
            </div>
            ) : (
            <div>
              <h2 className="text-xl font-bold mb-4">Change Password</h2>
              <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-start gap-3 max-w-xl">
                <FaGoogle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You signed in with <span className="font-semibold text-foreground">Google</span>, so your password is managed by Google. There&apos;s no password to change here.
                </p>
              </div>
            </div>
            )}

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold text-destructive mb-4">Danger Zone</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Permanently delete your account and all associated document chats. This action cannot be undone.
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
                      className="w-full h-11 rounded-lg border border-border bg-background focus:ring-2 focus:ring-destructive/20 focus:border-destructive/30 outline-none px-3 transition-all"
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
                  className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${interfaceSize === "comfortable" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  <p className="font-bold text-md">Comfortable</p>
                  <p className="text-xs text-muted-foreground mt-1">Default padding and text size setup.</p>
                </button>
                <button
                  onClick={() => setInterfaceSize("compact")}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all cursor-pointer ${interfaceSize === "compact" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  <p className="font-bold text-sm">Compact</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Smaller text, tighter spacing to fit more content.</p>
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold mb-4">Light / Dark Mode</h2>
              <div className="flex gap-4">
                {["light", "dark", "system"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTheme(m)}
                    className={`px-4 py-2 rounded-lg border font-medium transition capitalize ${theme === m ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
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
                <button 
                  onClick={() => setChatAppearance("modern")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${chatAppearance === "modern" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <div className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg rounded-br-none mb-3 text-xs font-semibold">Hello, what can you do?</div>
                  <p className="font-bold text-foreground text-sm">Modern</p>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">Rounded bubbles with flat corners</p>
                </button>
                <button 
                  onClick={() => setChatAppearance("classic")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${chatAppearance === "classic" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <div className="w-full bg-muted text-foreground py-2 px-4 rounded-lg mb-3 text-xs border border-border font-semibold">Hello, what can you do?</div>
                  <p className="font-bold text-foreground text-sm">Classic</p>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">Sleek solid background borders</p>
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-bold mb-4">Typography</h2>
              <p className="text-muted-foreground text-sm mb-6">Choose a font style that makes reading comfortable for you.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setTypography("sans")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all font-sans cursor-pointer ${typography === "sans" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  <span className="text-lg font-bold block mb-1">Aa</span>
                  <span className="text-xs font-semibold">Sans Serif</span>
                </button>
                <button 
                  onClick={() => setTypography("serif")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all font-serif cursor-pointer ${typography === "serif" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  <span className="text-lg font-bold block mb-1">Aa</span>
                  <span className="text-xs font-semibold">Serif</span>
                </button>
                <button 
                  onClick={() => setTypography("mono")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all font-mono cursor-pointer ${typography === "mono" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  <span className="text-lg font-bold block mb-1">Aa</span>
                  <span className="text-xs font-semibold">Monospace</span>
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
              <div className="bg-muted/30 border border-border rounded-lg p-6 flex flex-col gap-6">
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                    <p className="text-2xl font-bold">{isPro ? "Pro Plan" : "Free Plan"}</p>
                  </div>
                  {isPro && (
                    <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-md text-sm font-semibold">Active</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Documents Created</p>
                    <p className="text-lg font-semibold">{chatCount} <span className="text-muted-foreground text-sm font-normal">/ {isPro ? "Unlimited" : "3 limit"}</span></p>
                    {/* Visual Meter */}
                    {!isPro && (
                      <div className="w-full bg-border h-2 rounded-md mt-2 overflow-hidden">
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
                    <div className="pt-4 border-t border-border mt-2 flex flex-col gap-4">
                        <UpgradeButton isPro={isPro} />
                        
                        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all rounded-lg">
                              Cancel Subscription
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">Cancel Subscription?</DialogTitle>
                              <DialogDescription className="text-sm text-muted-foreground pt-2">
                                You are about to cancel your Pro subscription. Based on your remaining time, you will receive a <b>pro-rata refund</b>.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-6 space-y-4">
                              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex flex-col items-center text-center">
                                <p className="text-sm text-muted-foreground mb-1">Estimated Refund</p>
                                <p className="text-3xl font-extrabold text-primary">
                                  Rs. {(calculateProRataRefund().amount * 100).toFixed(2)}
                                </p>
                                <p className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-widest">
                                  {calculateProRataRefund().daysLeft} days remaining ({calculateProRataRefund().percentage.toFixed(0)}%)
                                </p>
                              </div>
                              
                              <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  <span>Refund will be processed automatically to your original payment method.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  <span>Money will be reflected in <b>5-6 business days</b>.</span>
                                </li>
                                <li className="flex items-start gap-3 text-destructive font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                  <span>Pro features will be revoked immediately upon cancellation.</span>
                                </li>
                              </ul>
                            </div>

                            <DialogFooter className="flex-col sm:flex-row gap-3">
                              <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)} disabled={isCancelling} className="flex-1 rounded-lg">
                                Keep Subscription
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={handleCancelSubscription} 
                                disabled={isCancelling}
                                className="flex-1 rounded-lg"
                              >
                                {isCancelling && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                                Confirm Cancellation
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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

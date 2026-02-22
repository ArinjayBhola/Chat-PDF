"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { LuCopy, LuCheck, LuShare2, LuLock, LuGlobe, LuUserPlus } from "react-icons/lu";
import axios from "axios";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  initialData?: {
    isShared: boolean;
    sharePermission: "view" | "edit";
    allowPublicView: boolean;
    shareToken?: string;
  };
}

export function ShareDialog({ open, onOpenChange, chatId, initialData }: ShareDialogProps) {
  const [isShared, setIsShared] = useState(initialData?.isShared ?? false);
  const [permission, setPermission] = useState<"view" | "edit">(initialData?.sharePermission ?? "view");
  const [allowPublic, setAllowPublic] = useState(initialData?.allowPublicView ?? false);
  const [shareToken, setShareToken] = useState(initialData?.shareToken);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/s/${shareToken}` 
    : "";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await axios.post("/api/chat/share", {
        chatId,
        isShared,
        sharePermission: permission,
        allowPublicView: allowPublic,
      });
      if (data.success) {
        setShareToken(data.shareToken);
        toast.success("Sharing settings updated");
      }
    } catch (error) {
      toast.error("Failed to update sharing settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuShare2 className="w-5 h-5" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Collaborate with others by sharing a link to this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Enable Sharing</label>
              <p className="text-xs text-muted-foreground">Allow others to access this chat via link.</p>
            </div>
            <button
              onClick={() => setIsShared(!isShared)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                isShared ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isShared ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {isShared && (
            <>
              {/* Permission Level */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={permission === "view" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPermission("view")}
                    className="flex items-center gap-2"
                  >
                    <LuLock className="w-4 h-4" />
                    View Only
                  </Button>
                  <Button
                    variant={permission === "edit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPermission("edit")}
                    className="flex items-center gap-2"
                  >
                    <LuUserPlus className="w-4 h-4" />
                    Can Edit
                  </Button>
                </div>
              </div>

              {/* Public Access */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <LuGlobe className="w-4 h-4 text-slate-500" />
                    <label className="text-sm font-medium">Allow Public Viewing</label>
                  </div>
                  <p className="text-xs text-muted-foreground">Anyone with the link can view (no login required).</p>
                </div>
                <button
                  onClick={() => setAllowPublic(!allowPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                    allowPublic ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Share Link */}
              {shareToken && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Share Link</label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={shareUrl} 
                      className="bg-slate-50 dark:bg-slate-900 border-dashed"
                    />
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                      {copied ? <LuCheck className="text-green-500" /> : <LuCopy />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button 
            className="w-full" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

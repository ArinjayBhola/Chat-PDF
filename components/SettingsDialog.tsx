// UI REDESIGN
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
import { MdDelete } from "react-icons/md";
import { toast } from "react-hot-toast";
import { deleteAccount } from "@/app/actions/delete-account";
import { signOut } from "next-auth/react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmationText !== "Delete") return;
    
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        toast.success("Account deleted successfully");
        signOut({ callbackUrl: "/" });
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Account Settings</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Manage your account settings and preferences here.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
             <div className="flex items-start gap-4">
                <div className="p-2 bg-destructive/10 rounded-full shrink-0">
                    <MdDelete className="w-5 h-5 text-destructive" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-foreground">
                        Delete Account
                    </h3>
                     <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3">
                      Type <strong className="font-semibold text-foreground uppercase">Delete</strong> to confirm:
                  </p>
                  <Input 
                     value={confirmationText}
                     onChange={(e) => setConfirmationText(e.target.value)}
                     placeholder="Type 'Delete' to confirm"
                     className="bg-background border-border h-10 rounded-lg text-sm"
                  />
                  <Button 
                     variant="destructive" 
                     className="w-full mt-4 h-10 rounded-lg font-semibold"
                     disabled={confirmationText !== "Delete" || isDeleting}
                     onClick={handleDeleteAccount}
                  >
                    {isDeleting ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin text-destructive-foreground" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Deleting...
                      </div>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

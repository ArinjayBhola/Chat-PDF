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
import { ImSpinner2 } from "react-icons/im";
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences here.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20 p-4">
             <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <MdDelete className="w-5 h-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                        Delete Account
                    </h3>
                     <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900/20">
                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                     Type <strong>Delete</strong> to confirm:
                 </p>
                 <Input 
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type 'Delete' to confirm"
                    className="bg-white dark:bg-slate-950"
                 />
                 <Button 
                    variant="destructive" 
                    className="w-full mt-4"
                    disabled={confirmationText !== "Delete" || isDeleting}
                    onClick={handleDeleteAccount}
                 >
                    {isDeleting && <ImSpinner2 className="w-4 h-4 mr-2 animate-spin" />}
                    Delete Account
                 </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

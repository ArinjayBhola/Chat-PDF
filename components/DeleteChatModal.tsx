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
import { ImSpinner2 } from "react-icons/im";
import { MdDelete } from "react-icons/md";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  chatName: string;
};

const DeleteChatModal = ({ isOpen, onClose, onConfirm, loading, chatName }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this chat?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-destructive/10 rounded-lg shrink-0">
                <MdDelete className="w-5 h-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">
                  Delete "{chatName}"
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-semibold">
                  Permanently delete this chat and all associated messages. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-destructive/10 flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading && <ImSpinner2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Delete Chat
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteChatModal;

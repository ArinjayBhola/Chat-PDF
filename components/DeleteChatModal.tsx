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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this chat?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20 p-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <MdDelete className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Delete "{chatName}"
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Permanently delete this chat and all associated messages. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900/20 flex gap-3 justify-end">
              <Button
                variant="destructive"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading && <ImSpinner2 className="w-4 h-4 mr-2 animate-spin" />}
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

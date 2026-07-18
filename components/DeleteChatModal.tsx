// UI REDESIGN
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this chat?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg shrink-0">
            <MdDelete className="w-5 h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground break-words">
              Delete &quot;{chatName}&quot;
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Permanently delete this chat and all associated messages. This action cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={loading} onClick={onConfirm}>
            {loading && <ImSpinner2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Delete Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteChatModal;

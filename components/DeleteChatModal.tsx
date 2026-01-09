import React from "react";
import { Button } from "./ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  chatName: string;
};

const DeleteChatModal = ({ isOpen, onClose, onConfirm, loading, chatName }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-xl w-[90%] max-w-md animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-semibold text-white mb-2">Delete Chat?</h2>
        <p className="text-slate-400 mb-6">
          Are you sure you want to delete <span className="font-bold text-white">"{chatName}"</span>? This action cannot
          be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-slate-300 hover:text-white hover:bg-slate-800">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatModal;

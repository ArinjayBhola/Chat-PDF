"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuUndo2 } from "react-icons/lu";

type UndoToastProps = {
  message: string;
  toastId: string;
  duration?: number;
  onUndo: () => void;
  onExpire: () => void;
};

export function UndoToast({ message, toastId, duration = 5000, onUndo, onExpire }: UndoToastProps) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    const timeout = setTimeout(() => {
      toast.dismiss(toastId);
      onExpire();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [duration, toastId, onExpire]);

  const progress = remaining / duration;
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="flex items-center gap-3 min-w-[280px]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{seconds}s to undo</p>
      </div>
      <button
        onClick={() => {
          toast.dismiss(toastId);
          onUndo();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        <LuUndo2 className="w-3.5 h-3.5" />
        Undo
      </button>
      <button
        onClick={() => {
          toast.dismiss(toastId);
          onExpire();
        }}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shrink-0"
      >
        Delete Now
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden rounded-b-lg">
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

type UndoableActionOptions = {
  message: string;
  duration?: number;
  onUndo: () => void;
  onConfirm: () => void;
};

export function showUndoToast({ message, duration = 5000, onUndo, onConfirm }: UndoableActionOptions) {
  const toastId = `undo-${Date.now()}`;

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-in slide-in-from-bottom-5 fade-in-0" : "animate-out slide-out-to-right-5 fade-out-0"
        } relative bg-background border border-border shadow-lg rounded-lg p-3 pointer-events-auto`}
      >
        <UndoToast
          message={message}
          toastId={toastId}
          duration={duration}
          onUndo={onUndo}
          onExpire={onConfirm}
        />
      </div>
    ),
    {
      id: toastId,
      duration: duration + 500, // slightly longer than internal timer
      position: "bottom-center",
    }
  );

  return toastId;
}

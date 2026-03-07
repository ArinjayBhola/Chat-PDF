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
import { DrizzleChat } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { LuGitCompareArrows, LuFileBox, LuCheck, LuLoaderCircle } from "react-icons/lu";
import { useRouter } from "next/navigation";

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chats: DrizzleChat[];
}

export function CompareDialog({ open, onOpenChange, chats }: CompareDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const toggleSelect = (chatId: string) => {
    if (isNavigating) return;
    setSelected((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, chatId];
    });
  };

  const handleCompare = () => {
    if (selected.length < 2 || isNavigating) return;
    setIsNavigating(true);
    const params = selected.join(",");
    router.push(`/compare?chats=${params}`);
  };

  const handleClose = (open: boolean) => {
    if (isNavigating) return;
    if (!open) setSelected([]);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuGitCompareArrows className="w-5 h-5" />
            Compare Documents
          </DialogTitle>
          <DialogDescription>
            Select 2 to 3 documents to compare. We&apos;ll find differences, contradictions, and common ground.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("py-3 transition-opacity", isNavigating && "opacity-50 pointer-events-none")}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Documents
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {selected.length}/3 selected
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {chats.length === 0 ? (
              <p className="text-sm text-muted-foreground italic px-2 py-4 text-center">
                No documents yet. Upload a file to get started.
              </p>
            ) : (
              chats.map((chat) => {
                const isSelected = selected.includes(chat.id);
                const isDisabled = !isSelected && selected.length >= 3;

                return (
                  <button
                    key={chat.id}
                    onClick={() => !isDisabled && toggleSelect(chat.id)}
                    disabled={isDisabled || isNavigating}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                      isSelected
                        ? "bg-primary/10 border border-primary/30 text-foreground"
                        : "bg-card border border-border hover:border-primary/20 hover:bg-muted/50 text-foreground",
                      (isDisabled || isNavigating) && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <LuCheck className="w-3 h-3" />}
                    </div>
                    <LuFileBox className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{chat.fileName}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <Button
          className="w-full text-sm font-bold"
          onClick={handleCompare}
          disabled={selected.length < 2 || isNavigating}
        >
          {isNavigating ? (
            <>
              <LuLoaderCircle className="w-4 h-4 mr-2 animate-spin" />
              Preparing Comparison...
            </>
          ) : (
            <>
              <LuGitCompareArrows className="w-4 h-4 mr-2" />
              Compare {selected.length} Document{selected.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

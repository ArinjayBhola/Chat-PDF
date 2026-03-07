import React, { memo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { DrizzleChat } from "@/lib/db/schema";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import { ChatItem } from "./ChatItem";
import FileUpload from "../FileUpload";
import { RiLoader2Fill } from "react-icons/ri";
import { LuGitCompareArrows, LuChevronDown, LuTrash2 } from "react-icons/lu";
import { CompareDialog } from "../CompareDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  className?: string;
  onToggle: () => void;
  chats: DrizzleChat[];
  chatId: string;
  isPro: boolean;
  onDeleteChat: (e: React.MouseEvent, chatId: string, chatName: string) => void;
};

type ComparisonItem = {
  id: string;
  chatIdsKey: string;
  createdAt: string;
  documents: { id: string; fileName: string }[];
};

const ExpandedSidebar = memo(({ className, onToggle, chats, chatId, isPro, onDeleteChat }: Props) => {
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonsExpanded, setComparisonsExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const currentChat = chats.find((c) => c.id === chatId);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: comparisons } = useQuery<ComparisonItem[]>({
    queryKey: ["comparisons-list"],
    queryFn: async () => {
      const res = await axios.get("/api/comparisons");
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleDeleteComparison = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDeletingId(id);
      await axios.delete(`/api/compare?id=${id}`);
      toast.success("Comparison deleted");
      queryClient.invalidateQueries({ queryKey: ["comparisons-list"] });
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  // Determine active comparison from URL
  const currentChatsParam = searchParams?.get("chats") || "";

  return (
    <div
      className={cn(
        "w-[280px] h-screen p-4 bg-sidebar flex flex-col border-r border-sidebar-border shadow-xl",
        "transition-all duration-300 ease-in-out",
        className,
      )}>
      <SidebarHeader onToggle={onToggle} />

      <FileUpload
        isPro={isPro}
        chatCount={chats.length}>
        {({ isUploading }) => (
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] h-10 rounded-lg justify-start px-4"
            disabled={isUploading}>
            {isUploading ? (
              <RiLoader2Fill className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <FaPlus className="mr-2 w-4 h-4" />
            )}
            <span className="font-semibold">{isUploading ? "Uploading..." : "New Chat"}</span>
          </Button>
        )}
      </FileUpload>

      {chats.length >= 2 && (
        <Button
          variant="outline"
          className="w-full mt-2 h-10 rounded-lg justify-start px-4 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
          onClick={() => setIsCompareOpen(true)}
        >
          <LuGitCompareArrows className="mr-2 w-4 h-4" />
          <span className="font-semibold">Compare</span>
        </Button>
      )}

      <CompareDialog
        open={isCompareOpen}
        onOpenChange={setIsCompareOpen}
        chats={chats}
      />

      <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-2 pr-2 custom-scrollbar">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">Your Chats</p>

        {chats.length === 0 ? (
          <div className="px-2 text-slate-500 text-sm italic">No chats yet.</div>
        ) : (
          chats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === chatId}
              onDelete={onDeleteChat}
            />
          ))
        )}

        {/* Comparisons Section */}
        {comparisons && comparisons.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setComparisonsExpanded(!comparisonsExpanded)}
              className="flex items-center justify-between w-full px-2 mb-2 group"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comparisons</p>
              <LuChevronDown className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform",
                !comparisonsExpanded && "-rotate-90"
              )} />
            </button>

            {comparisonsExpanded && (
              <div className="flex flex-col gap-1.5">
                {comparisons.map((comp) => {
                  const isActive = currentChatsParam === comp.chatIdsKey;
                  return (
                    <div key={comp.id} className="relative group">
                      <Link
                        href={`/compare?chats=${comp.chatIdsKey}`}
                        className="block"
                      >
                        <div className={cn(
                          "rounded-lg p-3 flex items-start gap-2.5 transition-all duration-200",
                          isActive
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}>
                          <LuGitCompareArrows className={cn(
                            "w-4 h-4 flex-shrink-0 mt-0.5",
                            isActive ? "text-purple-500" : "text-slate-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-0.5">
                              {comp.documents.map((doc, i) => (
                                <span key={doc.id} className="text-xs font-medium truncate block">
                                  {doc.fileName}
                                  {i < comp.documents.length - 1 && (
                                    <span className="text-muted-foreground/50"> vs</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                          {isActive && <div className="absolute right-0 top-1 bottom-1 w-1 bg-purple-500 rounded-l-full" />}
                        </div>
                      </Link>

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={(e) => handleDeleteComparison(e, comp.id)}
                          disabled={deletingId === comp.id}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete comparison"
                        >
                          {deletingId === comp.id ? (
                            <RiLoader2Fill className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LuTrash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <SidebarFooter
        isPro={isPro}
        chatCount={chats.length}
      />
    </div>
  );
});

ExpandedSidebar.displayName = "ExpandedSidebar";

export default ExpandedSidebar;

// UI REDESIGN
import React, { memo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { DrizzleChat, DrizzleFolder } from "@/lib/db/schema";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import FileUpload from "../FileUpload";
import { RiLoader2Fill } from "react-icons/ri";
import { LuGitCompareArrows, LuChevronDown, LuTrash2, LuFolderPlus } from "react-icons/lu";
import { CompareDialog } from "../CompareDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import SearchBar from "./SearchBar";
import FolderList from "./FolderList";
import CreateFolderDialog from "./CreateFolderDialog";

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
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [comparisonsExpanded, setComparisonsExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery<DrizzleFolder[]>({
    queryKey: ["folders-list"],
    queryFn: async () => {
      const res = await axios.get("/api/folders");
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

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

  const handleTogglePin = async (pinChatId: string, isPinned: boolean) => {
    const previousChats = queryClient.getQueryData<DrizzleChat[]>(["chats-list"]);
    queryClient.setQueryData<DrizzleChat[]>(["chats-list"], (old) =>
      old?.map((c) => (c.id === pinChatId ? { ...c, isPinned: isPinned ? "true" : "false" } : c))
    );
    try {
      await axios.patch("/api/chats/pin", { chatId: pinChatId, isPinned });
    } catch {
      queryClient.setQueryData(["chats-list"], previousChats);
      toast.error("Failed to update pin");
    }
  };

  // Determine active comparison from URL
  const currentChatsParam = searchParams?.get("chats") || "";

  return (
    <div
      className={cn(
        "w-[280px] h-screen p-4 bg-sidebar flex flex-col border-r border-sidebar-border",
        "transition-all duration-300 ease-in-out",
        className,
      )}>
      <SidebarHeader onToggle={onToggle} />

      <FileUpload
        isPro={isPro}
        chatCount={chats.length}>
        {({ isUploading }) => (
          <Button
            className="w-full h-10 justify-start px-4"
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
          className="w-full mt-2 h-10 rounded-lg justify-start px-4 border-dashed border-border hover:border-primary/50 hover:text-primary transition-all duration-200"
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
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Your Chats</p>
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="New folder"
          >
            <LuFolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <FolderList
          folders={folders}
          chats={chats}
          chatId={chatId}
          searchQuery={searchQuery}
          onDeleteChat={onDeleteChat}
          onTogglePin={handleTogglePin}
        />

        <CreateFolderDialog
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
        />

        {/* Comparisons Section */}
        {comparisons && comparisons.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setComparisonsExpanded(!comparisonsExpanded)}
              className="flex items-center justify-between w-full px-2 mb-2 group cursor-pointer"
            >
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Comparisons</p>
              <LuChevronDown className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
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
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                        )}>
                          <LuGitCompareArrows className={cn(
                            "w-4 h-4 flex-shrink-0 mt-0.5",
                            isActive ? "text-primary" : "text-muted-foreground"
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

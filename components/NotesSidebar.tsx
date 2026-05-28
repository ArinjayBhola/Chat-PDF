// UI REDESIGN
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LuTrash2,
  LuPlus,
  LuNotebook,
  LuX,
} from "react-icons/lu";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  source: string;
  createdAt: string;
};

type Props = {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
  refreshKey?: number;
};

const sourceBadge: Record<string, { label: string; className: string }> = {
  ai_response: {
    label: "AI",
    className: "bg-primary/10 text-primary",
  },
  user_message: {
    label: "User",
    className: "bg-muted text-muted-foreground",
  },
  manual: {
    label: "Manual",
    className: "bg-muted text-muted-foreground",
  },
};

export default function NotesSidebar({ chatId, isOpen, onClose, refreshKey }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes?chatId=${chatId}`);
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (isOpen) fetchNotes();
  }, [isOpen, fetchNotes, refreshKey]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notes.length]);

  const addNote = async () => {
    const content = newNote.trim();
    if (!content) return;

    try {
      setIsAdding(true);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content, source: "manual" }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [...prev, note]);
        setNewNote("");
        toast.success("Note added");
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes?noteId=${noteId}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success("Note deleted");
      }
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-border flex flex-col bg-background shadow-xl transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuNotebook className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Workspace Notes</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <LuX className="w-5 h-5" />
        </button>
      </div>

      {/* Notes List */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/30 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-primary/20 flex items-center justify-center border border-primary/40">
                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
              </span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Loading your notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-border rounded-lg bg-muted/10">
            <LuNotebook className="w-8 h-8 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-bold text-foreground">No notes yet</p>
              <p className="text-xs text-muted-foreground mt-1 px-4 leading-relaxed">
                Saved snippets from chat or your own notes will appear here.
              </p>
            </div>
          </div>
        ) : (
          notes.map((note) => {
            const badge = sourceBadge[note.source] || sourceBadge.manual;
            return (
              <div
                key={note.id}
                className="group relative p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-all duration-200 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", badge.className)}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90"
                  >
                    <LuTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words leading-relaxed font-medium">
                  {note.content}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  {formatDate(note.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/10">
        <div className="relative group">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addNote();
              }
            }}
            placeholder="Add a thought..."
            className="w-full text-sm p-3 pr-10 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none shadow-sm min-h-[80px]"
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim() || isAdding}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-primary text-primary-foreground hover:shadow-md disabled:opacity-50 transition-all active:scale-90"
          >
            {isAdding ? (
              <svg className="w-4 h-4 animate-spin text-primary-foreground" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <LuPlus className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center font-medium">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">Enter</kbd> to save
        </p>
      </div>
    </div>
  );
}

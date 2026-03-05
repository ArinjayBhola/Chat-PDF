"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LuTrash2,
  LuPlus,
  LuNotebook,
  LuX,
  LuLoaderCircle,
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
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  user_message: {
    label: "User",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  manual: {
    label: "Manual",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
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
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shadow-xl transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuNotebook className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-slate-900 dark:text-white">Workspace Notes</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <LuX className="w-5 h-5" />
        </button>
      </div>

      {/* Notes List */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LuLoaderCircle className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-slate-500">Loading your notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <LuNotebook className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">No notes yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-4">
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
                className="group relative p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", badge.className)}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <LuTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                  {note.content}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  {formatDate(note.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
            className="w-full text-sm p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-sm min-h-[80px]"
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim() || isAdding}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-primary text-primary-foreground hover:shadow-md disabled:opacity-50 transition-all"
          >
            {isAdding ? <LuLoaderCircle className="w-4 h-4 animate-spin" /> : <LuPlus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

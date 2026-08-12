"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { LuFileText, LuTrash2, LuArrowLeft } from "react-icons/lu";
import { MdDelete } from "react-icons/md";
import { ImSpinner2 } from "react-icons/im";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FileItem = { id: string; fileName: string; createdAt: string; pdfStatus: string };

export default function LibraryClient() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  useEffect(() => {
    axios.get("/api/library").then((r) => setFiles(r.data)).catch(() => toast.error("Failed to load library")).finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => files.reduce<Record<string, FileItem[]>>((acc, file) => {
    const key = new Date(file.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    (acc[key] ||= []).push(file);
    return acc;
  }, {}), [files]);

  const remove = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    try {
      await axios.delete("/api/library", { data: { chatId: id } });
      setFiles((current) => current.filter((file) => file.id !== id));
      setDeleteTarget(null);
      toast.success("File and chat deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(null);
    }
  };

  return <main className="mx-auto max-w-5xl px-6 py-10">
    <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2"><LuArrowLeft /> Back</Button>
    <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Your workspace</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Library</h1><p className="mt-2 text-muted-foreground">Every document you have uploaded, organized by date.</p></div>
    {loading ? <p className="text-muted-foreground">Loading your library…</p> : files.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">Your library is empty.</div> : <div className="space-y-8">{Object.entries(groups).reverse().map(([date, items]) => <section key={date}><h2 className="mb-3 text-sm font-semibold text-muted-foreground">{date}</h2><div className="overflow-hidden rounded-2xl border bg-card shadow-sm">{items.map((file) => <article key={file.id} className="flex items-center gap-4 border-b p-4 last:border-b-0 transition hover:bg-muted/30"><div className="rounded-xl bg-primary/10 p-3 text-primary"><LuFileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold" title={file.fileName}>{file.fileName}</h3><p className="mt-1 text-xs text-muted-foreground">{file.pdfStatus === "PROCESSING" ? "Processing…" : "Document"}</p></div><div className="flex shrink-0 items-center gap-2"><Button variant="outline" size="sm" onClick={() => router.push("/chat/" + file.id)}>Open chat</Button><button aria-label={"Delete " + file.fileName} onClick={() => setDeleteTarget(file)} disabled={deleting === file.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"><LuTrash2 className="h-4 w-4" /></button></div></article>)}</div></section>)}</div>}
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete file</DialogTitle>
          <DialogDescription>Are you sure you want to delete this file?</DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="shrink-0 rounded-lg bg-destructive/10 p-2"><MdDelete className="h-5 w-5 text-destructive" /></div>
          <div className="min-w-0"><h3 className="break-words text-sm font-bold">Delete &quot;{deleteTarget?.fileName}&quot;</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">This will permanently delete the file, its chat, messages, notes, and associated search data.</p></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={!!deleting}>Cancel</Button>
          <Button variant="destructive" onClick={remove} disabled={!!deleting}>{deleting && <ImSpinner2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Delete file</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>;
}

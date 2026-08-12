"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { LuFileText, LuTrash2, LuArrowLeft } from "react-icons/lu";
import { Button } from "@/components/ui/button";

type FileItem = { id: string; fileName: string; createdAt: string; pdfStatus: string };

export default function LibraryClient() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    axios.get("/api/library").then((r) => setFiles(r.data)).catch(() => toast.error("Failed to load library")).finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => files.reduce<Record<string, FileItem[]>>((acc, file) => {
    const key = new Date(file.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    (acc[key] ||= []).push(file);
    return acc;
  }, {}), [files]);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this file and its entire chat? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await axios.delete("/api/library", { data: { chatId: id } });
      setFiles((current) => current.filter((file) => file.id !== id));
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
    {loading ? <p className="text-muted-foreground">Loading your library…</p> : files.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">Your library is empty.</div> : <div className="space-y-8">{Object.entries(groups).reverse().map(([date, items]) => <section key={date}><h2 className="mb-3 text-sm font-semibold text-muted-foreground">{date}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((file) => <article key={file.id} className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/50"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><LuFileText /></div><div className="min-w-0"><h3 className="truncate font-semibold" title={file.fileName}>{file.fileName}</h3><p className="mt-1 text-xs text-muted-foreground">{file.pdfStatus === "PROCESSING" ? "Processing…" : "Document"}</p></div></div><button aria-label={"Delete " + file.fileName} onClick={() => remove(file.id)} disabled={deleting === file.id} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"><LuTrash2 /></button></div><Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/chat/" + file.id)}>Open chat</Button></article>)}</div></section>)}</div>}
  </main>;
}

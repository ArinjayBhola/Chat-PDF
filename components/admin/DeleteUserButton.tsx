"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export default function DeleteUserButton({userId,email,pending=false}: {userId:string;email:string;pending?:boolean}) {
 const {data:session}=useSession();
 const router=useRouter();
 const [open,setOpen]=useState(false), [confirmation,setConfirmation]=useState(""), [busy,setBusy]=useState(false), [message,setMessage]=useState(""), [error,setError]=useState("");
 const stopped=useRef(false);
 if (session?.user?.id===userId) return null;
 async function remove() {
  if (busy || confirmation!=="DELETE") return;
  setBusy(true); setError(""); stopped.current=false;
  try {
   while (!stopped.current) {
    const response=await fetch("/api/admin/users/"+encodeURIComponent(userId),{method:"DELETE"});
    const data=await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to delete account. Please retry.");
    setMessage(data.message);
    if (data.done) { setOpen(false); router.refresh(); break; }
    await new Promise(resolve=>setTimeout(resolve,2500));
   }
  } catch(error) { setError(error instanceof Error ? error.message : "Deletion failed. Please retry."); router.refresh(); }
  finally {setBusy(false);}
 }
 return <>
 <button type="button" onClick={()=>{setOpen(true);setMessage("");setError("");setConfirmation("");}} className="mt-3 text-xs font-medium text-destructive hover:underline">{pending ? "Resume deletion" : "Delete user"}</button>
 <Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value);}}><DialogContent onEscapeKeyDown={e=>{if(busy)e.preventDefault();}} onPointerDownOutside={e=>{if(busy)e.preventDefault();}}>
 <DialogHeader><DialogTitle>Delete user permanently?</DialogTitle><DialogDescription>This removes {email}, their documents, chats, comparisons, notes, account settings and usage history. Access is revoked first, including active sessions. This cannot be undone.</DialogDescription></DialogHeader>
 <label className="space-y-2 text-sm"><span>Type <strong>DELETE</strong> to confirm</span><input aria-label="Type DELETE to confirm account deletion" autoComplete="off" disabled={busy} value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2"/></label>
 {message && <p role="status" className="text-sm text-muted-foreground">{message} Keep this dialog open while cleanup finishes.</p>}
 {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
 <div className="flex justify-end gap-3"><button disabled={busy} onClick={()=>setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">Cancel</button><button disabled={busy || confirmation!=="DELETE"} onClick={()=>void remove()} className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Deleting..." : error || pending ? "Retry deletion" : "Delete permanently"}</button></div>
 </DialogContent></Dialog>
 </>;
}

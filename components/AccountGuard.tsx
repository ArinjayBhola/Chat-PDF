"use client";
import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
export default function AccountGuard() {
 const { data: session, status } = useSession();
 const seenUser = useRef(false);
 const userId = session?.user?.id;
 useEffect(() => {
  if (userId) seenUser.current=true;
  if (!userId && status === "authenticated" && seenUser.current) {
   void signOut({redirect:false}).finally(()=>window.location.replace("/sign-in?accountDeleted=1"));
  }
 },[userId,status]);
 useEffect(() => {
  if (!userId) return;
  let stopped = false, busy = false;
  async function check() {
   if (busy || stopped) return;
   busy = true;
   try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (response.ok) {
     const current = await response.json();
     if (!current?.user?.id && !stopped) {
      stopped = true;
      // Replace the entire page so open chats, viewers and in-memory query caches disappear.
      void signOut({ redirect: false }).finally(() => window.location.replace("/sign-in?accountDeleted=1"));
     }
    }
   } catch { /* Retry on reconnect; server authorization still fails closed. */ }
   finally { busy = false; }
  }
  const timer = setInterval(() => { if (document.visibilityState === "visible") void check(); }, 2000);
  const wake = () => { if (document.visibilityState === "visible") void check(); };
  document.addEventListener("visibilitychange",wake); window.addEventListener("focus",wake); window.addEventListener("online",wake);
  void check();
  return () => { stopped = true; clearInterval(timer); document.removeEventListener("visibilitychange",wake); window.removeEventListener("focus",wake); window.removeEventListener("online",wake); };
 },[userId]);
 return null;
}

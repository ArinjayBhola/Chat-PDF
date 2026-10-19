"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
export default function ActivityTracker() {
 const pathname = usePathname();
 const { data: session } = useSession();
 useEffect(() => {
  if (!session?.user?.id || pathname.startsWith("/admin")) return;
  const route = pathname.startsWith("/chat/") ? "/chat/[id]" : pathname.startsWith("/s/") ? "/s/[token]" : pathname;
  const id = crypto.randomUUID(); let seconds = 0; let sentSeconds = 0; let lastInput = Date.now();
  const input = () => { lastInput = Date.now(); };
  const flush = () => { if (seconds <= sentSeconds) return; const snapshot = seconds; sentSeconds = snapshot; void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, route, seconds }), keepalive: true }).then(response => { if (!response.ok) sentSeconds = Math.min(sentSeconds, snapshot - 1); }).catch(() => { sentSeconds = Math.min(sentSeconds, snapshot - 1); }); };
  const timer = setInterval(() => { if (document.visibilityState === "visible" && Date.now() - lastInput < 60000) seconds = Math.min(86400, seconds + 5); }, 5000);
  const heartbeat = setInterval(flush, 30000);
  const visibility = () => { if (document.visibilityState === "hidden") flush(); else lastInput = Date.now(); };
  window.addEventListener("pointerdown", input); window.addEventListener("keydown", input); window.addEventListener("scroll", input); window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", visibility);
  return () => { clearInterval(timer); clearInterval(heartbeat); flush(); window.removeEventListener("pointerdown", input); window.removeEventListener("keydown", input); window.removeEventListener("scroll", input); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", visibility); };
 }, [pathname, session?.user?.id]);
 return null;
}

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
export function accountStream(userId: string, requestSignal: AbortSignal) {
 const controller=new AbortController();
 let disposed=false, checking=false;
 const abort=()=>{controller.abort();dispose();};
 const timer=setInterval(async()=>{
  if(checking || disposed)return; checking=true;
  try {
   const state=await db.execute(sql`SELECT 1 FROM users WHERE id=${userId} AND deletion_requested_at IS NULL`);
   if(!state.rows.length)abort();
  } catch {abort();} finally {checking=false;}
 },1000);
 const timeout=setTimeout(abort,120000);
 function dispose(){if(disposed)return;disposed=true;clearInterval(timer);clearTimeout(timeout);requestSignal.removeEventListener("abort",abort);}
 requestSignal.addEventListener("abort",abort,{once:true});
 if(requestSignal.aborted)abort();
 return {signal:controller.signal,dispose};
}

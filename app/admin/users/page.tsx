import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import UserDirectory from "@/components/admin/UserDirectory";
import { PageHeading } from "@/components/admin/AdminUI";
import Link from "next/link";
export default async function UsersPage({searchParams}: {searchParams:Promise<{page?:string;q?:string}>}) {
 if (!await isAdmin("users")) notFound();
 const params=await searchParams;
 const page=Math.max(1,Math.min(100000,Number.parseInt(params.page || "1") || 1));
 const q=(params.q || "").slice(0,100);
 const [people,count]=await Promise.all([ db.execute(sql`SELECT u.id,u.name,u.email,u.created_at,u.last_login_at,
 (SELECT count(*) FROM chats c WHERE c.user_id=u.id AND c.file_deleted='false') AS documents,
 (SELECT count(*) FROM chats c WHERE c.user_id=u.id) + (SELECT count(*) FROM comparisons c WHERE c.user_id=u.id) AS chats,
 (SELECT count(*) FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.role='user' AND COALESCE(m.sender_id,c.user_id)=u.id) AS prompts,
 (SELECT COALESCE(sum(file_size_bytes),0) FROM chats c WHERE c.user_id=u.id AND c.file_deleted='false') AS bytes,
 (SELECT COALESCE(sum(active_seconds),0) FROM activity_visits a WHERE a.user_id=u.id) AS active,
 (SELECT model FROM model_usage m WHERE m.user_id=u.id GROUP BY model ORDER BY count(*) DESC,model LIMIT 1) AS model
 FROM users u WHERE u.name ILIKE ${'%'+q+'%'} OR u.email ILIKE ${'%'+q+'%'} ORDER BY u.created_at DESC,u.id LIMIT 50 OFFSET ${(page-1)*50}`), db.execute(sql`SELECT count(*) AS total FROM users WHERE name ILIKE ${'%'+q+'%'} OR email ILIKE ${'%'+q+'%'}`),]);

 const total=Number(count.rows[0].total);
 const totalPages=Math.max(1,Math.ceil(total/50));
 return <>
 <PageHeading title="Users" description="Account details and usage at a glance."/>
 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4 p-5">
   <div><h2 className="font-semibold">User directory <span className="ml-2 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{total.toLocaleString()}</span></h2><p className="mt-2 text-xs text-muted-foreground">{q ? "Matching your search" : "All registered accounts"}</p></div>
   <form className="flex w-full gap-2 sm:w-auto" action="/admin/users"><input aria-label="Search users by name or email" name="q" defaultValue={q} placeholder="Search name or email" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-64"/><button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Search</button>{q && <Link href="/admin/users" className="self-center text-xs text-muted-foreground underline">Clear</Link>}</form>
  </div>
  <UserDirectory users={people.rows.map(r=>({id:String(r.id),name:String(r.name || "Unnamed user"),email:String(r.email),joined:r.created_at ? String(r.created_at) : null,lastLogin:r.last_login_at ? String(r.last_login_at) : null,documents:Number(r.documents),chats:Number(r.chats),prompts:Number(r.prompts),storage:Number(r.bytes),active:Number(r.active),model:r.model ? String(r.model) : null}))}/>
  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted-foreground"><span>{total ? ((page-1)*50+1)+"-"+Math.min(page*50,total)+" of "+total+" users" : "0 users"}</span><div className="flex items-center gap-4">{page>1 && <Link className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-muted" href={`/admin/users?page=${page-1}&q=${encodeURIComponent(q)}`}>Previous</Link>}<span>Page {page} of {totalPages}</span>{page*50<total && <Link className="rounded-lg border border-border px-3 py-2 text-foreground hover:bg-muted" href={`/admin/users?page=${page+1}&q=${encodeURIComponent(q)}`}>Next</Link>}</div></footer>
 </section>
 <p className="text-xs leading-5 text-muted-foreground">Docs count retained files. Chats include document conversations and comparisons. Prompts count document-chat messages. Expand a user's usage details for their top model and username.</p>
 </>;
}

import AdminMonitoring from "@/components/AdminMonitoring";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
export const dynamic = "force-dynamic";
const bytes = (v: unknown) => { const n = Number(v || 0); return n >= 1073741824 ? (n / 1073741824).toFixed(2) + " GB" : (n / 1048576).toFixed(2) + " MB"; };
const time = (v: unknown) => (Number(v || 0) / 60).toFixed(1) + " min";
const date = (v: unknown) => v ? new Date(String(v)).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC" : "Not recorded";
function Table({ heads, rows }: { heads: string[]; rows: React.ReactNode[][] }) {
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{heads.map(h => <th key={h} className="whitespace-nowrap border-b border-border p-3 text-muted-foreground font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border/50">{r.map((c,j) => <td key={j} className="p-3">{c}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="p-6 text-muted-foreground">No data recorded yet.</p>}</div>;
}
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
 if (!await isAdmin()) notFound();
 const params = await searchParams;
 const page = Math.max(1, Math.min(100000, Number.parseInt(params.page || "1") || 1));
 const q = (params.q || "").slice(0,100);
 const [totals, heavy, routes, models, people, count] = await Promise.all([
 db.execute(sql`SELECT (SELECT count(*) FROM users) AS users, count(*) AS documents, COALESCE(sum(file_size_bytes) FILTER (WHERE file_deleted='false'),0) AS bytes, count(*) FILTER (WHERE file_size_bytes IS NULL AND file_deleted='false') AS unknown, count(*) FILTER (WHERE pdf_status='FAILED') AS failed, (SELECT COALESCE(sum(active_seconds)::numeric / NULLIF(count(DISTINCT user_id),0),0) FROM activity_visits) AS average FROM chats`),
 db.execute(sql`SELECT id, file_size_bytes, pdf_status, created_at FROM chats WHERE file_deleted='false' AND file_size_bytes IS NOT NULL ORDER BY file_size_bytes DESC LIMIT 10`),
 db.execute(sql`SELECT route, count(*) AS visits, count(DISTINCT user_id) AS users, sum(active_seconds) AS total, avg(active_seconds) AS average, sum(active_seconds)::numeric / count(DISTINCT user_id) AS per_user FROM activity_visits GROUP BY route ORDER BY sum(active_seconds) DESC`),
 db.execute(sql`SELECT model, string_agg(DISTINCT feature, ', ') AS feature, count(*) AS requests, count(DISTINCT user_id) AS users FROM model_usage GROUP BY model ORDER BY count(*) DESC`),
 db.execute(sql`SELECT u.id,u.name,u.email,u.created_at,u.last_login_at,
 (SELECT count(*) FROM chats c WHERE c.user_id=u.id AND c.file_deleted='false') AS documents,
 (SELECT count(*) FROM chats c WHERE c.user_id=u.id) + (SELECT count(*) FROM comparisons c WHERE c.user_id=u.id) AS chats,
 (SELECT count(*) FROM messages m JOIN chats c ON c.id=m.chat_id WHERE m.role='user' AND COALESCE(m.sender_id,c.user_id)=u.id) AS prompts,
 (SELECT COALESCE(sum(file_size_bytes),0) FROM chats c WHERE c.user_id=u.id AND c.file_deleted='false') AS bytes,
 (SELECT COALESCE(sum(active_seconds),0) FROM activity_visits a WHERE a.user_id=u.id) AS active,
 (SELECT model FROM model_usage m WHERE m.user_id=u.id GROUP BY model ORDER BY count(*) DESC,model LIMIT 1) AS model
 FROM users u WHERE u.name ILIKE ${'%'+q+'%'} OR u.email ILIKE ${'%'+q+'%'} ORDER BY u.created_at DESC,u.id LIMIT 50 OFFSET ${(page-1)*50}`),
 db.execute(sql`SELECT count(*) AS total FROM users WHERE name ILIKE ${'%'+q+'%'} OR email ILIKE ${'%'+q+'%'}`),
 ]);
 const t = totals.rows[0];
 return <main className="min-h-screen bg-background text-foreground p-4 md:p-10"><div className="mx-auto max-w-7xl space-y-8">
 <header className="flex flex-wrap justify-between gap-4"><div><p className="text-sm text-primary font-medium">ChatDoc administration</p><h1 className="text-3xl font-semibold mt-2">Usage overview</h1><p className="text-muted-foreground mt-2">Account and usage metadata. Document names, contents, URLs, and messages are excluded.</p></div><Link href="/" className="text-sm underline">Back to app</Link></header>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Registered users",String(t.users)],["Document chat records",String(t.documents)],["Known stored size",bytes(t.bytes)],["Avg active time / tracked user",time(t.average)],["Failed documents",String(t.failed)]].map(([label,value])=><div key={label} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold mt-3">{value}</p></div>)}</div>
 <p className="text-sm text-muted-foreground">{String(t.unknown)} stored documents have unknown size. Size totals exclude deleted files and unregistered uploads. Time is cumulative foreground activity per tracked user, pauses after 60 seconds without input, and excludes admin routes. Historical login, time, and model usage cannot be reconstructed.</p>
 <AdminMonitoring />
 <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">Largest documents</h2><Table heads={["Opaque document ID","Size","Processing","Uploaded"]} rows={heavy.rows.map(r=>[String(r.id),bytes(r.file_size_bytes),String(r.pdf_status),date(r.created_at)])}/></section>
 <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">Time by route</h2><Table heads={["Route","Visits","Users","Avg / visit","Avg / user","Total"]} rows={routes.rows.map(r=>[String(r.route),String(r.visits),String(r.users),time(r.average),time(r.per_user),time(r.total)])}/></section>
 <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">AI models used</h2><p className="text-sm text-muted-foreground mb-3">Completed chat, comparison and mind map responses; provider probes excluded.</p><Table heads={["Model","Feature","Responses","Users"]} rows={models.rows.map(r=>[String(r.model),String(r.feature),String(r.requests),String(r.users)])}/></section></div>
 <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">Users</h2><form className="flex gap-2 mb-4"><input aria-label="Search users by name or email" name="q" defaultValue={q} placeholder="Search name or email" className="rounded-lg border border-border bg-background p-2"/><button className="rounded-lg bg-primary text-primary-foreground px-4">Search</button></form>
 <Table heads={["Name","Email","Username","Last login","Joined","Documents","Chats","Prompts","Known size","Active time","Top model"]} rows={people.rows.map(r=>[String(r.name || "Not set"),String(r.email),"Not set",date(r.last_login_at),date(r.created_at),String(r.documents),String(r.chats),String(r.prompts),bytes(r.bytes),time(r.active),String(r.model || "Not recorded")])}/>
 <p className="text-xs text-muted-foreground my-3">Chats count document conversations plus comparisons. Documents count retained files. Prompts count document-chat user messages. The app does not collect usernames.</p>
 <div className="flex gap-4 text-sm">{page>1 && <Link href={`/admin?page=${page-1}&q=${encodeURIComponent(q)}`}>Previous</Link>}<span>Page {page} ? {String(count.rows[0].total)} users</span>{page*50<Number(count.rows[0].total) && <Link href={`/admin?page=${page+1}&q=${encodeURIComponent(q)}`}>Next</Link>}</div></section>
 </div></main>;
}

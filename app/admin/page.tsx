import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { bytes, time } from "@/lib/admin-format";
import { PageHeading } from "@/components/admin/AdminUI";
import Link from "next/link";
export default async function AdminPage() {
 if (!await isAdmin("overview")) notFound();
 const totals = await db.execute(sql`SELECT (SELECT count(*) FROM users) AS users, count(*) AS documents, COALESCE(sum(file_size_bytes) FILTER (WHERE file_deleted='false'),0) AS bytes, count(*) FILTER (WHERE file_size_bytes IS NULL AND file_deleted='false') AS unknown, count(*) FILTER (WHERE pdf_status='FAILED') AS failed, (SELECT COALESCE(sum(active_seconds)::numeric / NULLIF(count(DISTINCT user_id),0),0) FROM activity_visits) AS average FROM chats`);
 const t=totals.rows[0];
 return <><PageHeading title="Overview" description="A quick view of account activity and registered document storage. Open a section for detailed reports."/> <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Registered users",String(t.users)],["Document chat records",String(t.documents)],["Known stored size",bytes(t.bytes)],["Avg active time / tracked user",time(t.average)],["Failed documents",String(t.failed)]].map(([label,value])=><div key={label} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold mt-3">{value}</p></div>)}</div>
 <p className="text-sm text-muted-foreground">{String(t.unknown)} stored documents have unknown size. Size totals exclude deleted files and unregistered uploads. Time is cumulative foreground activity per tracked user, pauses after 60 seconds without input, and excludes admin routes. Historical login, time, and model usage cannot be reconstructed.</p>
<div className="grid gap-4 md:grid-cols-2">{[["documents","Documents & storage","Review large files and storage alerts."],["engagement","User engagement","Explore daily activity, route time and retention."],["ai","AI performance","Compare model usage and provider failures."],["users","User directory","Find account details and usage totals."]].map(([path,title,description])=><Link key={path} href={"/admin/"+path} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50"><h2 className="font-semibold">{title} &rarr;</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></Link>)}</div></>;
}

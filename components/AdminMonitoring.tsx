import ActivityChart from "@/components/admin/ActivityChart";
import { adminDate } from "@/lib/admin-format";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { storageThreshold } from "@/lib/admin-policy";
// Render only after the parent page has authorized and audited the administrator.
function Grid({ heads, rows }: { heads: string[]; rows: string[][] }) {
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{heads.map(h => <th key={h} className="border-b border-border p-3 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} className="border-b border-border/50 p-3">{c}</td>)}</tr>)}</tbody></table>{rows.length===0 && <p className="p-4 text-muted-foreground">No events recorded yet.</p>}</div>;
}
const percent = (n: unknown,d: unknown) => Number(d) > 0 ? (100*Number(n)/Number(d)).toFixed(1)+"%" : "Pending";

export async function StorageMonitoring() {
 const storage=await db.execute(sql`SELECT COALESCE(sum(file_size_bytes),0) AS bytes, count(*) FILTER (WHERE file_size_bytes IS NULL) AS unknown, count(*) FILTER (WHERE file_size_bytes >= ${storageThreshold(process.env.ADMIN_LARGE_FILE_MB,100)*1048576}) AS large FROM chats WHERE file_deleted='false'`);
 const s=storage.rows[0];
 const limit=storageThreshold(process.env.ADMIN_STORAGE_LIMIT_GB,10)*1073741824;
 const warning=Math.min(100,storageThreshold(process.env.ADMIN_STORAGE_WARNING_PERCENT,80));
 const used=100*Number(s.bytes)/limit;
 const state=used>=100 ? "Critical" : used>=warning ? "Warning" : "Within configured threshold";

 return <>
 <section className="rounded-2xl border border-border p-5 space-y-3"><h2 className="text-lg font-semibold">Storage alerts</h2>
 <p role="status" className={used>=warning ? "font-semibold text-destructive" : "font-medium"}>{state}: {(Number(s.bytes)/1073741824).toFixed(2)} GB / {(limit/1073741824).toFixed(2)} GB ({used.toFixed(1)}%)</p>
 <p className="text-sm text-muted-foreground">Warning at {warning}%. {String(s.large)} files exceed the {storageThreshold(process.env.ADMIN_LARGE_FILE_MB,100)} MB large-file threshold. {String(s.unknown)} retained files have unknown size; usage may be understated. These alerts cover registered files and appear when this dashboard loads.</p></section>
</>;
}
export async function EngagementMonitoring() {
 const [daily,retention]=await Promise.all([ db.execute(sql`WITH days AS (SELECT generate_series((now() AT TIME ZONE 'Asia/Kolkata')::date - 29, (now() AT TIME ZONE 'Asia/Kolkata')::date, interval '1 day')::date AS day) SELECT d.day::text, count(a.user_id) AS users FROM days d LEFT JOIN daily_activity_ist a ON a.day=d.day GROUP BY d.day ORDER BY d.day DESC`), db.execute(sql`WITH first_seen AS (SELECT user_id,min(day) AS first_day FROM daily_activity_ist GROUP BY user_id), cohorts AS (SELECT date_trunc('week',first_day)::date AS week, f.*, (now() AT TIME ZONE 'Asia/Kolkata')::date AS today FROM first_seen f) SELECT week::text,count(*) AS users,
 count(*) FILTER (WHERE first_day+1<=today) AS eligible1,
 count(*) FILTER (WHERE first_day+7<=today) AS eligible7,
 count(*) FILTER (WHERE first_day+30<=today) AS eligible30,
 count(*) FILTER (WHERE first_day+1<=today AND EXISTS (SELECT 1 FROM daily_activity_ist a WHERE a.user_id=c.user_id AND a.day=c.first_day+1)) AS retained1,
 count(*) FILTER (WHERE first_day+7<=today AND EXISTS (SELECT 1 FROM daily_activity_ist a WHERE a.user_id=c.user_id AND a.day=c.first_day+7)) AS retained7,
 count(*) FILTER (WHERE first_day+30<=today AND EXISTS (SELECT 1 FROM daily_activity_ist a WHERE a.user_id=c.user_id AND a.day=c.first_day+30)) AS retained30
 FROM cohorts c GROUP BY week ORDER BY week DESC LIMIT 12`)]);
 return <> <div className="grid gap-6 lg:grid-cols-2"><ActivityChart days={daily.rows.map(r => ({ day: String(r.day), users: Number(r.users) })).reverse()} />
 <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-2">Retention by first active week</h2><p className="text-sm text-muted-foreground mb-3">Return activity on exactly day 1, 7 or 30 after a user's first tracked day. Historical IST activity is seeded from visit start times; visits spanning days cannot be reconstructed. Only users old enough for each interval enter its denominator. Pending means no eligible users.</p><Grid heads={["Cohort (IST)","Users","Day 1","Day 7","Day 30"]} rows={retention.rows.map(r=>[adminDate(r.week,false),String(r.users),percent(r.retained1,r.eligible1),percent(r.retained7,r.eligible7),percent(r.retained30,r.eligible30)])}/></section></div>
</>;
}
export async function ProviderMonitoring() {
 const errors=await db.execute(sql`SELECT provider,model,feature,category,count(*) AS events,max(created_at) AS latest FROM provider_errors WHERE created_at >= (now() AT TIME ZONE 'UTC') - interval '30 days' GROUP BY provider,model,feature,category ORDER BY count(*) DESC LIMIT 50`);
 return <> <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-2">Provider errors - last 30 days</h2><p className="text-sm text-muted-foreground mb-3">AI chat, comparison, mind map and health-probe failures. Safe categories only; prompts, documents, raw error messages, and API keys are excluded. Fallback responses may still succeed.</p><Grid heads={["Provider","Model","Feature","Category","Errors","Last error (IST)"]} rows={errors.rows.map(r=>[String(r.provider),String(r.model),String(r.feature),String(r.category),String(r.events),adminDate(r.latest)])}/></section>
</>;
}
export async function AccessMonitoring() {
 const audit=await db.execute(sql`SELECT actor_id,outcome,action,created_at FROM admin_access_logs ORDER BY created_at DESC,id DESC LIMIT 100`);
 return <> <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-2">Admin access log</h2><p className="text-sm text-muted-foreground mb-3">Latest 100 allowed and denied dashboard requests. Actor IDs refer to signed-in accounts; anonymous attempts have no actor. Search terms and credentials are excluded.</p><Grid heads={["Time (IST)","Actor ID","Result","Action"]} rows={audit.rows.map(r=>[adminDate(r.created_at),String(r.actor_id || "Anonymous"),String(r.outcome),String(r.action)])}/></section>
</>;
}

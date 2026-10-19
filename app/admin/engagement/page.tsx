import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { time } from "@/lib/admin-format";
import { Table, PageHeading } from "@/components/admin/AdminUI";
import { EngagementMonitoring } from "@/components/AdminMonitoring";
export default async function EngagementPage() {
 if (!await isAdmin("engagement")) notFound();
 const routes=await db.execute(sql`SELECT route, count(*) AS visits, count(DISTINCT user_id) AS users, sum(active_seconds) AS total, avg(active_seconds) AS average, sum(active_seconds)::numeric / count(DISTINCT user_id) AS per_user FROM activity_visits GROUP BY route ORDER BY sum(active_seconds) DESC`);
 return <><PageHeading title="Engagement" description="Daily activity, retention and active time across your app. Calendar days and weekly cohorts follow IST."/><EngagementMonitoring/><section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">Time by route</h2><Table heads={["Route","Visits","Users","Avg / visit","Avg / user","Total"]} rows={routes.rows.map(r=>[String(r.route),String(r.visits),String(r.users),time(r.average),time(r.per_user),time(r.total)])}/></section></>;
}

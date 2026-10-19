import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

import { Table, PageHeading } from "@/components/admin/AdminUI";
import { ProviderMonitoring } from "@/components/AdminMonitoring";
export default async function AIPage() {
 if (!await isAdmin("ai")) notFound();
 const models=await db.execute(sql`SELECT model, string_agg(DISTINCT feature, ', ') AS feature, count(*) AS requests, count(DISTINCT user_id) AS users FROM model_usage GROUP BY model ORDER BY count(*) DESC`);
 return <><PageHeading title="AI usage & errors" description="Understand which models serve users most often and review categorized provider failures."/><section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">AI models used</h2><p className="text-sm text-muted-foreground mb-3">Completed chat, comparison and mind map responses; provider probes excluded.</p><Table heads={["Model","Feature","Responses","Users"]} rows={models.rows.map(r=>[String(r.model),String(r.feature),String(r.requests),String(r.users)])}/></section><ProviderMonitoring/></>;
}

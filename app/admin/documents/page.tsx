import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { bytes, adminDate as date } from "@/lib/admin-format";
import { Table, PageHeading } from "@/components/admin/AdminUI";
import { StorageMonitoring } from "@/components/AdminMonitoring";
export default async function DocumentsPage() {
 if (!await isAdmin("documents")) notFound();
 const heavy=await db.execute(sql`SELECT id, file_size_bytes, pdf_status, created_at FROM chats WHERE file_deleted='false' AND file_size_bytes IS NOT NULL ORDER BY file_size_bytes DESC LIMIT 10`);
 return <><PageHeading title="Documents & storage" description="Monitor storage pressure and the largest registered files using opaque document IDs. User filenames and contents remain private."/><StorageMonitoring/> <section className="rounded-2xl border border-border p-4"><h2 className="text-lg font-semibold mb-3">Largest documents</h2><Table heads={["Opaque document ID","Size","Processing","Uploaded"]} rows={heavy.rows.map(r=>[String(r.id),bytes(r.file_size_bytes),String(r.pdf_status),date(r.created_at)])}/></section>
</>;
}

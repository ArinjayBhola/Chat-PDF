import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { hasAdminAccess } from "@/lib/admin-policy";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
export async function isAdmin(section: "overview" | "users" | "documents" | "engagement" | "ai" | "access-logs") {
 const session = await getServerSession(authOptions);
 const allowed = hasAdminAccess(session?.user, process.env.ADMIN_EMAILS || "");
 // Fail closed if the audit write fails. Never store search terms, tokens or document data.
 await db.execute(sql`INSERT INTO admin_access_logs(id,actor_id,outcome,action) VALUES (${crypto.randomUUID()},${session?.user?.id || null},${allowed ? "allowed" : "denied"},${"dashboard_" + section})`);
 return allowed;
}

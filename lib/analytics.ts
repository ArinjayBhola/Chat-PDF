import { providerErrorCategory } from "@/lib/admin-policy";
import "server-only";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
export async function recordModelUsage(userId: string, model: string, feature: string) {
 try { await db.execute(sql`INSERT INTO model_usage (id,user_id,model,feature) VALUES (${crypto.randomUUID()},${userId},${model},${feature})`); }
 catch { console.error("Model analytics write failed"); }
}

export async function recordProviderError(provider: string, model: string, feature: string, error: unknown) {
 try { await db.execute(sql`INSERT INTO provider_errors(id,provider,model,feature,category) VALUES (${crypto.randomUUID()},${provider},${model},${feature},${providerErrorCategory(error)})`); }
 catch { console.error("Provider error analytics write failed"); }
}

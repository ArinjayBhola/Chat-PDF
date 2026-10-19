import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { migrationStatements } from "../lib/migration-statements";

async function main() {
 if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing from your environment or .env file");
 const sql = neon(process.env.DATABASE_URL);
 for (const file of ["0002_admin_analytics.sql", "0003_admin_monitoring.sql", "0004_admin_ist.sql", "0005_account_deletion.sql"]) {
  const path = fileURLToPath(new URL("../drizzle/" + file, import.meta.url));
  const statements = migrationStatements(readFileSync(path, "utf8"));
  for (const [index, statement] of statements.entries()) {
   try { await sql.query(statement); }
   catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    // Do not print connection strings, request details, or row data.
    throw new Error(file + " statement " + (index + 1) + " failed (code " + code + "). Check database connectivity, permissions and prerequisite tables.");
   }
  }
  console.log(file + " applied.");
 }
 const result = await sql.query("SELECT to_regclass('public.daily_activity_ist') AS table_name");
 if (!result[0]?.table_name) throw new Error("IST activity table verification failed");
 console.log("Admin analytics schema ready (IST activity table verified).");
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Admin schema setup failed"); process.exitCode = 1; });

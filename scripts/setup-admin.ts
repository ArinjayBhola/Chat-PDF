import "dotenv/config";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
async function main() {
 for (const file of ["drizzle/0002_admin_analytics.sql", "drizzle/0003_admin_monitoring.sql"]) {
  for (const statement of readFileSync(file, "utf8").split(";").filter(s => s.trim())) await sql.query(statement);
 }
 console.log("Admin analytics schema ready.");
}
main().catch(() => { console.error("Admin schema setup failed"); process.exitCode = 1; });

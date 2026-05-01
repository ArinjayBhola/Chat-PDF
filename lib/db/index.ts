import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Fix for HMR in Next.js: ensure only one DB instance is created
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle> | undefined;
};

if (!process.env.DATABASE_URL) {
  throw new Error("Database url not found");
}

const sql = neon(process.env.DATABASE_URL);

export const db = globalForDb.db ?? drizzle(sql);

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
const routes = new Set(["/", "/chat", "/chat/[id]", "/compare", "/library", "/settings", "/s/[token]"]);
export async function POST(req: Request) {
 const session = await getServerSession(authOptions);
 if (!session?.user?.id) return new NextResponse(null, { status: 401 });
 if (req.headers.get("origin") !== new URL(req.url).origin) return new NextResponse(null, { status: 403 });
 try {
  const { id, route, seconds } = await req.json();
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !routes.has(route) || !Number.isInteger(seconds) || seconds < 1 || seconds > 86400) return new NextResponse(null, { status: 400 });
  await db.execute(sql`WITH changed AS (INSERT INTO activity_visits (id,user_id,route,active_seconds) VALUES (${id},${session.user.id},${route},${seconds}) ON CONFLICT (id) DO UPDATE SET active_seconds = GREATEST(activity_visits.active_seconds, EXCLUDED.active_seconds) WHERE activity_visits.user_id = EXCLUDED.user_id AND activity_visits.route = EXCLUDED.route AND activity_visits.active_seconds < EXCLUDED.active_seconds RETURNING user_id) INSERT INTO daily_activity_ist(user_id,day) SELECT user_id,(now() AT TIME ZONE 'Asia/Kolkata')::date FROM changed ON CONFLICT DO NOTHING`);
  return new NextResponse(null, { status: 204 });
 } catch { return new NextResponse(null, { status: 503 }); }
}

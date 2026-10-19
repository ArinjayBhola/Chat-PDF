import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  if (token?.id && !pathname.startsWith("/api/auth/") && pathname !== "/sign-in" && pathname !== "/sign-up") {
    const account = await db.select({ deleting: users.deletionRequestedAt }).from(users).where(eq(users.id, String(token.id))).limit(1);
    if (!account[0] || account[0].deleting) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Account unavailable" }, { status: 401 });
      return NextResponse.redirect(new URL("/sign-in?accountDeleted=1", req.url));
    }
  }

  if (token && !req.nextUrl.searchParams.has("accountDeleted") && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.includes("/api/auth") || pathname.startsWith("/s/") || token) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/chat") || pathname.startsWith("/compare")) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/",
  ],
};

import { NextResponse } from "next/server";

// Deprecated. Dodo payment webhooks are handled at /api/webhooks/dodo with
// Standard Webhooks signature verification. Point the Dodo dashboard there.
export async function POST() {
  return new NextResponse("This endpoint is no longer in use", { status: 410 });
}

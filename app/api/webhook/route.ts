import { NextResponse } from "next/server";

// This endpoint is deprecated. Payment verification is now handled
// server-side via /api/payment-callback with proper signature verification.
export async function POST() {
  return new NextResponse("This endpoint is no longer in use", { status: 410 });
}

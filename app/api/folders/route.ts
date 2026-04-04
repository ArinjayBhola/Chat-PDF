import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userFolders = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, session.user.id))
    .orderBy(desc(folders.createdAt));

  return NextResponse.json(userFolders);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const result = await db
      .insert(folders)
      .values({
        id: crypto.randomUUID(),
        name: name.trim(),
        userId: session.user.id,
      })
      .returning({ id: folders.id });

    return NextResponse.json({ id: result[0].id }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import CompareView from "@/components/CompareView";

const ComparePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ chats?: string }>;
}) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const { chats: chatIdsParam } = await searchParams;
  if (!chatIdsParam) {
    return redirect("/chat");
  }

  const chatIds = chatIdsParam.split(",").filter(Boolean);
  if (chatIds.length < 2 || chatIds.length > 3) {
    return redirect("/chat");
  }

  // Fetch all user chats (for add document feature)
  const allChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, session.user.id))
    .orderBy(desc(chats.createdAt));

  // Verify selected chats exist and belong to user
  const documents = [];
  for (const id of chatIds) {
    const found = allChats.find((c) => c.id === id);
    if (!found) {
      return redirect("/chat");
    }
    documents.push({ id: found.id, fileName: found.fileName });
  }

  return <CompareView chatIds={chatIds} documents={documents} allChats={allChats} />;
};

export default ComparePage;

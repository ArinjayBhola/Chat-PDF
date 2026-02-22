import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import ChatLayout from "@/components/ChatLayout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

type Props = {
  params: Promise<{ token: string }>;
};

const PublicSharePage = async ({ params }: Props) => {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  const _chats = await db
    .select()
    .from(chats)
    .where(and(eq(chats.shareToken, token), eq(chats.isShared, "true")));

  if (_chats.length === 0) {
    return redirect("/");
  }

  const currentChat = _chats[0];

  const isOwner = session?.user?.id === currentChat.userId;

  return (
    <ChatLayout 
      chat={currentChat}
      isOwner={isOwner}
      session={session}
    />
  );
};

export default PublicSharePage;

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import ChatLayout from "@/components/ChatLayout";

type Props = {
  params: Promise<{ chatId: string }>;
};

const page = async ({ params, searchParams }: {
    params: Promise<{ chatId: string }>;
    searchParams: Promise<{ token?: string }>;
}) => {
  const { chatId } = await params;
  const { token } = await searchParams;
  const session = await getServerSession(authOptions);

  // Fetch chat data
  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length === 0) {
    return redirect("/");
  }

  const currentChat = _chats[0];

  // Permission Logic
  const isOwner = session?.user?.id === currentChat.userId;
  const isShared = currentChat.isShared === "true" && (token === currentChat.shareToken || currentChat.allowPublicView === "true");

  if (!isOwner && !isShared) {
    if (!session?.user?.id) {
       return redirect(`/sign-in?callbackUrl=/chat/${chatId}`);
    }
    return redirect("/");
  }

  // Pass necessary info to client component
  return (
    <ChatLayout 
      chat={currentChat}
      isOwner={isOwner}
      session={session}
    />
  );
};

export default page;

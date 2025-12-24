import ChatSidebar from "@/components/ChatSidebar";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const ChatLayout = async ({ children }: Props) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex w-full h-full">
        {/* Chat Sidebar */}
        <div className="flex-[1] max-w-xs block">
          <ChatSidebar chats={_chats} />
        </div>

        {/* Main Content */}
        <div className="flex-[8] h-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default ChatLayout;

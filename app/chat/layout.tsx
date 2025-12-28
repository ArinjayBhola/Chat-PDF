import ChatSidebar from "@/components/ChatSidebar";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const ChatLayout = async ({ children }: Props) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, session.user.id));

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Chat Sidebar - Fixed Width */}
      <div className="w-[280px] h-full flex-shrink-0 hidden md:block">
        <ChatSidebar chats={_chats} />
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ChatLayout;

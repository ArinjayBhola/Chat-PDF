// UI REDESIGN
import ChatSidebar from "@/components/ChatSidebar";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import MobileNav from "@/components/MobileNav";
import UserMenu from "@/components/UserMenu";
import { checkSubscription } from "@/lib/subscription";
import ThemeToggle from "@/components/ThemeToggle";

type Props = {
  children: React.ReactNode;
};

const ChatLayout = async ({ children }: Props) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const [_chats, isPro] = await Promise.all([
    db
      .select()
      .from(chats)
      .where(eq(chats.userId, session.user.id))
      .orderBy(desc(chats.createdAt)),
    checkSubscription(),
  ]);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background text-foreground">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background z-20">
        <div className="flex items-center gap-3">
          <MobileNav chats={_chats} isPro={isPro} />
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            <span className="text-primary">Docs</span>Chat.ai
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="sidebar" />
          <UserMenu user={session.user} />
        </div>
      </div>

      <div className="h-full flex-shrink-0 hidden md:block transition-all duration-300 ease-in-out">
        <ChatSidebar
          chats={_chats}
          isPro={isPro}
        />
      </div>

      <div className="flex-1 h-full overflow-hidden flex flex-col">{children}</div>
    </div>
  );
};

export default ChatLayout;

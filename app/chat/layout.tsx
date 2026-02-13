import ChatSidebar from "@/components/ChatSidebar";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FaBars } from "react-icons/fa";
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

  const _chats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, session.user.id))
    .orderBy(desc(chats.createdAt));
  const isPro = await checkSubscription();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-white dark:bg-slate-900">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-20">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden">
                <FaBars className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[280px]">
              <ChatSidebar
                chats={_chats}
                isPro={isPro}
                className="border-none"
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            <span className="text-blue-500 dark:text-blue-400">PDF</span> Chat.ai
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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

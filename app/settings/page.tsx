import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { chats, userSubscriptions } from "@/lib/db/schema";
import { users, accounts } from "@/lib/db/auth-schema";
import { and, eq } from "drizzle-orm";
import SettingsClient from "@/components/SettingsClient";
import { checkSubscription } from "@/lib/subscription";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LuLibrary } from "react-icons/lu";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.user.id) {
    return redirect("/sign-in");
  }

  // Fetch subscription details
  const isPro = await checkSubscription();
  const subData = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, session.user.id))
    .limit(1);

  const expiryDate = subData[0]?.subscriptionEndDate || null;

  // Determine if this is a credentials account (Google/OAuth accounts have no password)
  const userRow = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const hasPassword = !!userRow[0]?.password;

  // Is a Google account already linked?
  const googleAccount = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(and(eq(accounts.userId, session.user.id), eq(accounts.provider, "google")))
    .limit(1);
  const hasGoogle = googleAccount.length > 0;

  // Fetch chats
  const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, session.user.id));
  const isAuth = !!session?.user;

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground animate-in fade-in duration-1000">
      <Navbar isAuth={isAuth} user={session?.user} hideSettingsButton={true} />

      <div className="max-w-6xl mx-auto py-10 px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          <Link href="/library">
            <Button variant="outline" className="gap-2">
              <LuLibrary className="h-4 w-4" />
              Open Library
            </Button>
          </Link>
        </div>
        <SettingsClient
          email={session.user.email}
          isPro={isPro}
          expiryDate={expiryDate}
          chatCount={userChats.length}
          hasPassword={hasPassword}
          hasGoogle={hasGoogle}
        />
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { chats, userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import SettingsClient from "@/components/SettingsClient";
import { checkSubscription } from "@/lib/subscription";

import Navbar from "@/components/Navbar";

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

  // Fetch chats
  const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, session.user.id));
  const isAuth = !!session?.user;

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground animate-in fade-in duration-1000">
      <Navbar isAuth={isAuth} user={session?.user} hideSettingsButton={true} />

      <div className="max-w-6xl mx-auto py-10 px-6 lg:px-8">
        <SettingsClient 
          email={session.user.email} 
          isPro={isPro} 
          expiryDate={expiryDate} 
          chatCount={userChats.length} 
        />
      </div>
    </div>
  );
}

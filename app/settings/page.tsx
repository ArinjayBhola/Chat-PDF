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
      {/* Modern Warm Background consistent with Home */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-orange-200 dark:from-primary/30 dark:to-orange-900/30 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
      </div>
      
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

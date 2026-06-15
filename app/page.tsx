// UI REDESIGN
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import FileUpload from "@/components/FileUpload";
import { MdLogin } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { checkSubscription } from "@/lib/subscription";
import UpgradeButton from "@/components/UpgradeButton";
import PricingSection from "@/components/PricingSection";
import PaymentSuccessHandler from "@/components/PaymentSuccessHandler";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const isAuth = !!session?.user;

  const resolvedSearchParams = await searchParams;
  const paymentStatus = resolvedSearchParams.payment as string | undefined;

  const isPro = await checkSubscription();

  let chatCount = 0;
  if (session?.user?.id) {
    const _chats = await db.select().from(chats).where(eq(chats.userId, session.user.id));
    chatCount = _chats.length;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground animate-in fade-in duration-700">
      {paymentStatus && (
        <PaymentSuccessHandler paymentStatus={paymentStatus} />
      )}

      <Navbar isAuth={isAuth} user={session?.user} />

      {/* Hero Content */}
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl mb-6">
            Chat with any <span className="text-primary">Document</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg tracking-normal leading-relaxed text-muted-foreground max-w-2xl mx-auto font-medium">
            Join millions of students, researchers and professionals to instantly answer questions and understand research with AI.
          </p>

          {!isAuth && (
            <div className="mt-10 flex items-center justify-center">
              <Link href={"/sign-in"}>
                <Button className="rounded-md px-8 h-12 text-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
                  Get Started for Free <MdLogin className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {isAuth && (
            <div className="mt-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="relative rounded-md border border-border bg-card p-6 sm:p-8 overflow-hidden">
                <div className="mb-6 pb-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <p className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md ${isPro ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-primary/10 text-primary"}`}>
                      {isPro ? "Pro Plan" : "Free Plan"}
                    </p>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {isPro ? "Unlimited uploads" : `${chatCount}/3 free uploads used`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {!isPro && <UpgradeButton isPro={isPro} />}
                    <Link href="/chat" className="w-full sm:w-auto">
                      <Button variant="secondary" className="w-full sm:w-auto rounded-lg">
                        Go to Chats
                      </Button>
                    </Link>
                  </div>
                </div>

                <h2 className="text-lg font-bold mb-4 text-left">Upload a document</h2>
                
                <FileUpload
                  isPro={isPro}
                  chatCount={chatCount}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {isAuth && !isPro && <PricingSection isPro={isPro} />}

      <footer className="py-12 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-sm font-medium text-muted-foreground">
          <Link target="_blank" href="https://github.com/ArinjayBhola/Chat-PDF" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <FaGithub className="w-5 h-5" />
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}

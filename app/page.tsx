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
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI-powered document chat
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Chat with any <span className="text-primary">Document</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed tracking-normal text-muted-foreground sm:text-lg">
            Join millions of students, researchers and professionals to instantly answer questions and understand research with AI.
          </p>

          {!isAuth && (
            <div className="mt-10 flex items-center justify-center">
              <Link href={"/sign-in"}>
                <Button className="h-12 px-8 text-base">
                  Get Started for Free <MdLogin className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {isAuth && (
            <div className="mx-auto mt-12 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-col items-center justify-between gap-4 border-b border-border pb-6 sm:flex-row">
                  <div className="flex items-center gap-3">
                    <p className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${isPro ? "bg-green-500/10 text-green-600 dark:text-green-500" : "bg-primary/10 text-primary"}`}>
                      {isPro ? "Pro Plan" : "Free Plan"}
                    </p>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {isPro ? "Unlimited uploads" : `${chatCount}/3 free uploads used`}
                    </span>
                  </div>
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    {!isPro && <UpgradeButton isPro={isPro} />}
                    <Link href="/chat" className="w-full sm:w-auto">
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Go to Chats
                      </Button>
                    </Link>
                  </div>
                </div>

                <h2 className="mb-4 text-left text-lg font-bold">Upload a document</h2>

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

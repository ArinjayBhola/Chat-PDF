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
  const razorpay_payment_link_status = resolvedSearchParams.razorpay_payment_link_status;
  const razorpay_payment_link_id = resolvedSearchParams.razorpay_payment_link_id;

  const isPro = await checkSubscription();

  let chatCount = 0;
  if (session?.user?.id) {
    const _chats = await db.select().from(chats).where(eq(chats.userId, session.user.id));
    chatCount = _chats.length;
  }

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground animate-in fade-in duration-1000">
      {isAuth && razorpay_payment_link_status === "paid" && razorpay_payment_link_id && (
        <PaymentSuccessHandler
          userId={session!.user.id}
          searchParams={resolvedSearchParams}
        />
      )}

      {/* Modern Warm Background with Top Right Nav */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-orange-200 dark:from-primary/30 dark:to-orange-900/30 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
      </div>

      <Navbar isAuth={isAuth} user={session?.user} />

      {/* Hero Content */}
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl mb-6">
            Chat with any <span className="text-primary">Document</span>
          </h1>
          <p className="mt-6 text-lg tracking-wide leading-8 text-muted-foreground max-w-2xl mx-auto font-medium">
            Join millions of students, researchers and professionals to instantly answer questions and understand research with AI.
          </p>

          {!isAuth && (
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href={"/sign-in"}>
                <Button className="rounded-full px-10 h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_30px_rgb(var(--primary)_/_0.3)] dark:shadow-[0_8px_30px_rgb(var(--primary)_/_0.5)] transition-all hover:scale-105">
                  Get Started for Free <MdLogin className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {isAuth && (
            <div className="mt-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="relative rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <h2 className="text-2xl font-bold mb-6 text-left">Upload a document</h2>
                
                <FileUpload
                  isPro={isPro}
                  chatCount={chatCount}
                />

                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <p className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isPro ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"}`}>
                      {isPro ? "Pro Plan" : "Free Plan"}
                    </p>
                    <span className="text-sm text-muted-foreground font-medium">
                      {isPro ? "Unlimited uploads" : `${chatCount}/3 free uploads used`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {!isPro && <UpgradeButton isPro={isPro} />}
                    <Link href="/chat">
                      <Button className="w-full sm:w-auto rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        Go to Chats
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAuth && !isPro && <PricingSection isPro={isPro} />}

      <footer className="py-12 border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-sm font-medium text-muted-foreground">
          <p>© {new Date().getFullYear()} Docs Chat.ai. All rights reserved.</p>
          <Link target="_blank" href="https://github.com/ArinjayBhola/Chat-PDF" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <FaGithub className="w-5 h-5" />
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}

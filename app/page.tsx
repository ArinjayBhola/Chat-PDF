import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import FileUpload from "@/components/FileUpload";
import UserMenu from "@/components/UserMenu";
import { MdLogin } from "react-icons/md";
import { checkSubscription } from "@/lib/subscription";
import UpgradeButton from "@/components/UpgradeButton";
import { userSubscriptions } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import PricingSection from "@/components/PricingSection";

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

  if (isAuth && razorpay_payment_link_status === "paid" && razorpay_payment_link_id) {
    // Fallback: Update DB if redirected back with success params
    await db.insert(userSubscriptions).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        razorpayCustomerId: "fallback_cust_id",
        razorpayPriceId: "pro_plan",
        razorpayCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
            razorpayCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
    });
  }

  const isPro = await checkSubscription();

  return (
    <div className="relative isolate min-h-screen bg-slate-50">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">Chat with any PDF</h1>
              {isAuth && <UserMenu user={session.user} />}
            </div>

            <div className="flex gap-x-6 mb-8">
              {isAuth && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Link href="/chat">
                      <Button
                        size="lg"
                        className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white h-10">
                        Go to chats
                      </Button>
                    </Link>
                    {!isPro && (
                      <div className="w-[160px]">
                        <UpgradeButton isPro={isPro} />
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-semibold px-4 py-1.5 rounded-full ${isPro ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"} shadow-sm ring-1 ring-slate-200/50`}>
                    Tier: {isPro ? "Pro" : "Free"}
                  </p>
                </div>
              )}
            </div>

            <p className="text-lg leading-8 text-slate-600 mb-10">
              Join millions of students, researchers, and professionals to instantly answer questions and understand
              research with AI. Clean, powerful, and distraction-free.
            </p>

            <div className="w-full max-w-md mx-auto">
              {isAuth ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
                  <FileUpload />
                </div>
              ) : (
                <Link href={"/sign-in"}>
                  <Button
                    size="lg"
                    className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Login to get started
                    <MdLogin className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {
        isPro ? <></> : <PricingSection isPro={isPro} />
      }
    </div>
  );
}

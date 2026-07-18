import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { cache } from "react";

export const checkSubscription = cache(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return false;
  }

  const _userSubscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, session.user.id));

  if (!_userSubscriptions[0]) {
    return false;
  }

  const userSubscription = _userSubscriptions[0];

  // Access is valid while the paid period hasn't ended. A "cancelled" sub still
  // gets access until its end date (Dodo cancels at period end; the in-app
  // cancel flow sets the end date to now when it refunds). Only "expired" and
  // "failed" revoke immediately regardless of the stored date.
  const isValid =
    (!!userSubscription.dodoPaymentId || !!userSubscription.dodoSubscriptionId) &&
    !!userSubscription.subscriptionEndDate &&
    userSubscription.subscriptionEndDate.getTime() > Date.now() &&
    userSubscription.status !== "expired" &&
    userSubscription.status !== "failed";

  return isValid;
});

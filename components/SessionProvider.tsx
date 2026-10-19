"use client";
import AccountGuard from "@/components/AccountGuard";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

export default function SessionProvider({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return <NextAuthSessionProvider session={session}><AccountGuard />{children}</NextAuthSessionProvider>;
}

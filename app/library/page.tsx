import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LibraryClient from "@/components/LibraryClient";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");
  return <div className="min-h-screen bg-background text-foreground"><Navbar isAuth user={session.user} hideSettingsButton /><LibraryClient /></div>;
}

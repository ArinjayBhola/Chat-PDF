import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LuFileQuestion, LuMessageSquare } from "react-icons/lu";
import { FaHome } from "react-icons/fa";


export default function NotFound() {
  return (
    <div className="relative isolate min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-accent border border-border shadow-sm">
            <LuFileQuestion className="w-14 h-14 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-xs mx-auto text-base leading-relaxed">
            Oops! It seems this page has gone missing from our archives. Let&apos;s get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto px-8 h-12">
              <FaHome className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/chat" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto px-8 h-12">
              <LuMessageSquare className="w-5 h-5 mr-2" />
              My Chats
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

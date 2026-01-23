import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LuFileQuestion, LuMessageSquare } from "react-icons/lu";
import { FaHome } from "react-icons/fa";


export default function NotFound() {
  return (
    <div className="relative isolate min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#80808020_1px,transparent_1px),linear-gradient(to_bottom,#80808020_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative flex justify-center">
          <div className="absolute -inset-4 bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full" />
          <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700">
            <LuFileQuestion className="w-24 h-24 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100">
            404
          </h1>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Page Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto text-lg leading-relaxed">
            Oops! It seems this page has gone missing from our archives. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto rounded-xl px-8 shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white h-12">
              <FaHome className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/chat" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 h-12 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
              <LuMessageSquare className="w-5 h-5 mr-2" />
              My Chats
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

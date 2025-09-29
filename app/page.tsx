import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import FileUpload from "@/components/FileUpload";

export default async function Home() {
  const user = await currentUser();
  const isAuth = !!user?.emailAddresses[0].id;
  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF</h1>
            <UserButton />
          </div>

          <div className="flex mt-2">{isAuth && <Button>Go to chats</Button>}</div>
          <p className="max-w-xl mt-2 text-lg text-slate-600">
            Join millions of students, researches, and professionals to instantly answer questions and understand
            research with AI.
          </p>
          <div className="w-full mt-4">
            {isAuth ? (
              <h1>
                <FileUpload />
              </h1>
            ) : (
              <Link href={"/sign-in"}>
                <Button>
                  Login to get started
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
          {/* Add Image of App */}
        </div>
      </div>
    </div>
  );
}

import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import ChatComponent from "@/components/ChatComponent";

type Props = {
  params: Promise<{ chatId: string }>;
};

const page = async ({ params }: Props) => {
  const { chatId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  // Fetch only the specific chat for checking ownership and getting PDF URL
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

  // Verify chat exists and belongs to user
  const currentChat = _chats.find((chat) => chat.id === chatId);

  if (!currentChat) {
    return redirect("/");
  }

  return (
    <div className="flex w-full h-full max-h-[100vh] overflow-hidden">
      {/* Main PDF Viewer */}
      <div className="w-1/2 h-full p-0 border-r border-slate-200">
        <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
      </div>
      
      {/* Chat Component */}
      <div className="w-1/2 h-full bg-white border-l border-slate-100 shadow-[-5px_0_15px_rgba(0,0,0,0.02)] z-10">
        <ChatComponent chatId={chatId} />
      </div>
    </div>
  );
};

export default page;

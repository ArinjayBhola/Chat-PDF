import ChatSidebar from "@/components/ChatSidebar";
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

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats) {
    return redirect("/");
  }
  if (!_chats.find((chat) => chat.id === chatId)) {
    return redirect("/");
  }

  const currentChats = _chats.find((chat) => chat.id === chatId);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex w-full h-full">
        {/* Chat Sidebar */}
        <div className="flex-[1] max-w-xs">
          <ChatSidebar
            chats={_chats}
            chatId={chatId}
          />
        </div>

        {/* Main PDF Viewer */}
        <div className="flex-[5] h-full p-4 overflow-hidden">
          <PDFViewer pdf_url={currentChats?.pdfUrl || ""} />
        </div>
        {/* Chat Component */}
        <div className="flex-[3] border-l-4 border-l-slate-200 h-full overflow-hidden">
          <ChatComponent />
        </div>
      </div>
    </div>
  );
};

export default page;

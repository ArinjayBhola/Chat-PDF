import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import ChatComponent from "@/components/ChatComponent";

type Props = {
  params: Promise<{ chatId: string }>;
};

const page = async ({ params }: Props) => {
  const { chatId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  // Fetch only the specific chat for checking ownership and getting PDF URL
  const _chats = await db.select().from(chats).where(eq(chats.userId, session.user.id));

  // Verify chat exists and belongs to user
  const currentChat = _chats.find((chat) => chat.id === chatId);

  if (!currentChat) {
    return redirect("/");
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* Main PDF Viewer Area */}
      <div className="flex-1 min-w-0 h-screen overflow-hidden border-r border-slate-200 bg-slate-50">
        <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
      </div>
      
      {/* Chat Component Area */}
      <div className="w-[650px] h-screen bg-white border-l border-slate-200 shadow-lg z-10 flex-shrink-0">
        <ChatComponent chatId={chatId} />
      </div>
    </div>
  );
};

export default page;

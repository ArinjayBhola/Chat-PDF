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
    <div className="flex w-full h-full">
      {/* Main PDF Viewer */}
      <div className="flex-[5] h-full p-4 overflow-hidden">
        <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
      </div>
      {/* Chat Component */}
      <div className="flex-[3] border-l-4 border-l-slate-200 h-full overflow-hidden">
        <ChatComponent chatId={chatId} />
      </div>
    </div>
  );
};

export default page;

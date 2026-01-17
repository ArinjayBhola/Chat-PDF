import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";
import ChatComponent from "@/components/ChatComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResizableSplit from "@/components/ResizableSplit";

type Props = {
  params: Promise<{ chatId: string }>;
};

const page = async ({ params }: Props) => {
  const { chatId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, session.user.id));

  const currentChat = _chats.find((chat) => chat.id === chatId);

  if (!currentChat) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden bg-white dark:bg-slate-900">
      <div className="lg:hidden flex-1 overflow-hidden flex flex-col h-full">
        <Tabs
          defaultValue="chat"
          className="flex-1 flex flex-col h-full">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">PDF Viewer</TabsTrigger>
              <TabsTrigger value="chat">AI Chat</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="pdf"
            className="flex-1 min-h-0 m-0">
            <div className="w-full h-full p-2 bg-slate-50 dark:bg-slate-900">
              <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
            </div>
          </TabsContent>
          <TabsContent
            value="chat"
            className="flex-1 min-h-0 m-0 overflow-hidden">
            <ChatComponent 
              chatId={chatId} 
              summary={currentChat.summary || undefined}
              suggestedQuestions={currentChat.suggestedQuestions || []}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:flex w-full h-full overflow-hidden">
        <ResizableSplit
          leftPanel={
            <div className="w-full h-full overflow-hidden border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
            </div>
          }
          rightPanel={
            <div className="w-full h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-lg z-10 flex flex-col">
              <ChatComponent 
                chatId={chatId} 
                summary={currentChat.summary || undefined}
                suggestedQuestions={currentChat.suggestedQuestions || []}
              />
            </div>
          }
          defaultLeftWidth={60}
          minLeftWidth={30}
          minRightWidth={30}
          storageKey={`chat-split-${chatId}`}
        />
      </div>
    </div>
  );
};

export default page;

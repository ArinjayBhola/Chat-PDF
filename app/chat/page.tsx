import React from "react";
import { MessageCircle } from "lucide-react";

const ChatPage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center justify-center max-w-md p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-md border border-blue-200">
          <MessageCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Chat PDF</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Select a chat from the sidebar to continue your conversation, or start a new one directly.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;

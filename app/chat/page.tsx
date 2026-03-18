import React from "react";
import { FiMessageCircle, FiUpload, FiSearch } from "react-icons/fi";

const ChatPage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center max-w-md p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
          <FiMessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to ChatDoc</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Select a chat from the sidebar to continue your conversation, or start a new one.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:bg-muted/50 transition-colors">
            <FiUpload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Upload a file</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:bg-muted/50 transition-colors">
            <FiSearch className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Ask questions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

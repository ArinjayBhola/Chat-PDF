// UI REDESIGN
import React from "react";
import { FiMessageCircle, FiUpload, FiSearch } from "react-icons/fi";

const ChatPage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center max-w-md p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/15 shadow-sm">
          <FiMessageCircle className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Welcome to DocsChat</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
          Select a chat from the sidebar to continue your conversation, or upload a new file.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/25 transition-all duration-200 shadow-xs">
            <FiUpload className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Upload a file</span>
          </div>
          <div className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/25 transition-all duration-200 shadow-xs">
            <FiSearch className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Ask questions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

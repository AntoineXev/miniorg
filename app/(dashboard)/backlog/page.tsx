"use client";

import { Header } from "@/components/layout/header";
import { BacklogContent } from "@/components/backlog/backlog-content";

export default function BacklogPage() {
  return (
    <>
      <div className="flex flex-col h-full">
        <Header 
          title="Backlog" 
          subtitle="All your tasks, organized by deadline"
        />
        
        <div className="flex-1 overflow-auto">
          <BacklogContent />
        </div>
      </div>

      {/* Footer hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘ K</kbd>
          {" "}to create a task anywhere in the app
        </div>
      </div>
    </>
  );
}

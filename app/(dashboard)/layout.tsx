"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TimelineSidebar } from "@/components/calendar/timeline-sidebar";
import { BacklogSidebar } from "@/components/backlog/backlog-sidebar";
import { Button } from "@/components/ui/button";
import { Calendar, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

// Force dynamic rendering to avoid pre-rendering issues with auth
export const dynamic = 'force-dynamic';

type RightSidebarPanel = "timeline" | "backlog" | null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<RightSidebarPanel>("timeline");

  const togglePanel = (panel: RightSidebarPanel) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto rounded-l-lg border bg-card shadow-sm">
            {children}
          </main>
        </div>

        {/* Right Sidebar System - Double Sidebar */}
        <div className="flex gap-0 flex-shrink-0">
          {/* Panel Content Area */}
          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden border-l border-t border-b shadow-sm bg-card",
            activePanel ? "w-[380px] opacity-100" : "w-0 opacity-0"
          )}>
            {activePanel === "timeline" && <TimelineSidebar />}
            {activePanel === "backlog" && <BacklogSidebar />}
          </div>

          {/* Icon Bar - Always Visible */}
          <div className="w-14 flex-shrink-0 bg-background border rounded-r-lg shadow-sm flex flex-col items-center py-4 gap-1">
            <button
              onClick={() => togglePanel("timeline")}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                activePanel === "timeline"
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-200/70"
              )}
              title="Timeline"
            >
              <Calendar className="h-5 w-5" />
            </button>

            <button
              onClick={() => togglePanel("backlog")}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                activePanel === "backlog"
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-200/70"
              )}
              title="Backlog"
            >
              <ListTodo className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

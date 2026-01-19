"use client";

import { useState, useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { TimelineSidebar } from "@/components/calendar/timeline-sidebar";
import { BacklogSidebar } from "@/components/backlog/backlog-sidebar";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { Button } from "@/components/ui/button";
import { CalendarClock, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";
import { useRouter } from "next/navigation";
import { emitTaskUpdate } from "@/lib/task-events";

type RightSidebarPanel = "timeline" | "backlog" | null;

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<RightSidebarPanel>("timeline");
  const { data: session, status } = useSession();
  const { pushInfo } = useToast();
  const hasRedirected = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Vérifie si la session est chargée et si l'utilisateur n'est pas authentifié
    if (status === "loading") return; // Attend que la session soit chargée
    
    if ((status === "unauthenticated" || !session?.user) && !hasRedirected.current) {
      hasRedirected.current = true;
      
      // Affiche le toast avant la redirection
      pushInfo(
        "Déconnecté",
        "Pour des raisons de sécurité vous avez été déconnecté"
      );
      
      router.push("/login");
    }
  }, [status, session, pushInfo, router]);

  // Affiche un écran de chargement pendant la vérification
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Ne rend pas le contenu si pas de session
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

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
          <main className="flex-1 overflow-auto rounded-l-lg border bg-background shadow-sm">
            {children}
          </main>
        </div>

        {/* Right Sidebar System - Double Sidebar */}
        <div className="flex gap-0 flex-shrink-0">
          {/* Panel Content Area */}
          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden border-l border-t border-b shadow-sm bg-background",
            activePanel ? "w-[350px] opacity-100" : "w-0 opacity-0"
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
              <CalendarClock strokeWidth={1} className="h-5 w-5" />
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
              <ClipboardList strokeWidth={1} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Quick Add Task - Accessible from anywhere */}
      <QuickAddTask onTaskCreated={() => emitTaskUpdate()} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}

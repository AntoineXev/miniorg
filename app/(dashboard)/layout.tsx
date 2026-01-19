"use client";

import { useState, useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { RightSidebar, RightSidebarPanel } from "@/components/layout/right-sidebar";
import { RightSidebarProvider, useRightSidebar } from "@/components/layout/right-sidebar/context";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { useToast } from "@/providers/toast";
import { useRouter } from "next/navigation";
import { emitTaskUpdate } from "@/lib/services/task-events";
import { QuickAddTaskProvider } from "@/providers/quick-add-task";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

function DashboardContentInner({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { activePanel } = useRightSidebar();
  const { data: session, status } = useSession();
  const { pushInfo } = useToast();
  const hasRedirected = useRef(false);
  const router = useRouter();
  
  // Load saved layout from localStorage
  const [defaultLayout, setDefaultLayout] = useState<{ [id: string]: number } | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const saved = localStorage.getItem("miniorg-dashboard-layout");
    return saved ? JSON.parse(saved) : undefined;
  });

  // Save layout changes to localStorage
  const handleLayoutChange = (layout: { [id: string]: number }) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("miniorg-dashboard-layout", JSON.stringify(layout));
  };

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

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 overflow-hidden p-2">
        <div className="flex h-full">
          <ResizablePanelGroup 
            orientation="horizontal" 
            className="flex-1 gap"
            onLayoutChanged={handleLayoutChange}
            defaultLayout={defaultLayout}
          >
            {/* Main content */}
            <ResizablePanel id="main-content" defaultSize={75} minSize={40}>
              <main className="h-full overflow-auto rounded-l-lg border bg-background shadow-sm">
                {children}
              </main>
            </ResizablePanel>

            {/* Resizable Panel Content - Only show when a panel is active */}
            {activePanel && (
              <>
                <ResizableHandle className="w-2 bg-transparent hover:bg-primary/10" />
                <ResizablePanel id="right-sidebar" defaultSize={350} minSize={250} maxSize={500}>
                  <RightSidebarPanel />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>

          {/* Right Sidebar Icon Bar - Always visible, fixed width, with gap */}
          <div className="h-full">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Global Quick Add Task - Accessible from anywhere */}
      <QuickAddTask onTaskCreated={() => emitTaskUpdate()} />
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <RightSidebarProvider>
      <DashboardContentInner>{children}</DashboardContentInner>
    </RightSidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <QuickAddTaskProvider>
        <DashboardContent>{children}</DashboardContent>
      </QuickAddTaskProvider>
    </SessionProvider>
  );
}

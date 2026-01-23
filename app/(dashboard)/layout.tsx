"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { RightSidebar, RightSidebarPanel } from "@/components/layout/right-sidebar";
import { RightSidebarProvider, useRightSidebar } from "@/components/layout/right-sidebar/context";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useTauriSession } from "@/providers/tauri-session";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/lib/hooks/use-platform";
import { useTauriQuerySync } from "@/lib/hooks/use-tauri-query-sync";
import { useTauriTaskHandler } from "@/lib/hooks/use-tauri-task-handler";
import { QuickAddWindow } from "@/components/layout/quick-add-window";
import { isTauri } from "@/lib/platform";
import { listen, TauriEvents } from "@/lib/tauri/events";
import { TimelineDragProvider } from "@/lib/contexts/timeline-drag-context";
function DashboardContentInner({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { activePanel } = useRightSidebar();
  const { session, status } = useTauriSession();
  const hasRedirected = useRef(false);
  const router = useRouter();
  const { isTauri } = usePlatform();

  // Sync React Query cache across Tauri windows
  useTauriQuerySync();

  // Handle task creation requests from quick-add window
  useTauriTaskHandler();

  // Listen for navigation events from other Tauri windows
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen(TauriEvents.NAVIGATE_TO, (path) => {
        router.push(path);
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [router]);
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
      toast.info(
        "Déconnecté",
        {
          description: "Pour des raisons de sécurité vous avez été déconnecté"
        }
      );
      router.push("/login");
    }
  }, [status, session, router]);

  // Affiche un écran de chargement pendant la vérification
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <Loader size="lg" showText text="Chargement de votre session" />
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
      <div data-tauri-drag-region={true} className={cn("flex-1 overflow-hidden", isTauri ? "p-2 pt-6" : "p-2")}>
        <div className="flex h-full" data-tauri-drag-region={false}>
          <ResizablePanelGroup 
            orientation="horizontal" 
            className="flex-1 gap"
            onLayoutChanged={handleLayoutChange}
            defaultLayout={defaultLayout}
          >
            {/* Main content */}
            <ResizablePanel id="main-content" defaultSize={75} minSize={40}>
              <main  className="h-full overflow-auto rounded-l-lg border bg-background shadow-sm">
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
      <QuickAddTask onTaskCreated={() => {}} />
    </div>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <RightSidebarProvider>
      <TimelineDragProvider>
        <DashboardContentInner>{children}</DashboardContentInner>
      </TimelineDragProvider>
    </RightSidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isTauri()) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        setWindowLabel(getCurrentWindow().label);
      });
    } else {
      // Not Tauri, treat as main window
      setWindowLabel("main");
    }
  }, []);

  // Don't render until we know the window label
  if (windowLabel === null) {
    return null;
  }

  return windowLabel === "main" ? <DashboardContent>{children}</DashboardContent> : <QuickAddWindow />;
}

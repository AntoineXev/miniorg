"use client";

import { PANELS } from "./panels.config";
import { RightSidebarIconBar } from "./right-sidebar-icon-bar";
import { useRightSidebar } from "./context";

export function RightSidebar() {
  const { activePanel, setActivePanel } = useRightSidebar();

  const togglePanel = (panelId: string) => {
    if (activePanel === panelId) {
      setActivePanel(null);
    } else {
      setActivePanel(panelId);
    }
  };

  return (
    <div className="h-full">
      <RightSidebarIconBar
        panels={PANELS}
        activePanel={activePanel}
        onToggle={togglePanel}
      />
    </div>
  );
}

export function RightSidebarPanel() {
  const { activePanel } = useRightSidebar();
  
  const activePanelConfig = PANELS.find((panel) => panel.id === activePanel);
  const ActivePanelComponent = activePanelConfig?.component;

  if (!ActivePanelComponent) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden border-l border-t border-b shadow-sm bg-background">
      <ActivePanelComponent />
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useUserSettings } from "@/lib/hooks/use-user-settings";

type RightSidebarContextType = {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
};

const RightSidebarContext = createContext<RightSidebarContextType | undefined>(
  undefined
);

export function RightSidebarProvider({ children }: { children: ReactNode }) {
  const { getRightSidebarActivePanel, setRightSidebarActivePanel } = useUserSettings();
  
  const [activePanel, setActivePanelState] = useState<string | null>(() => getRightSidebarActivePanel());

  const setActivePanel = (panel: string | null) => {
    setActivePanelState(panel);
    setRightSidebarActivePanel(panel);
  };

  return (
    <RightSidebarContext.Provider value={{ activePanel, setActivePanel }}>
      {children}
    </RightSidebarContext.Provider>
  );
}

export function useRightSidebar() {
  const context = useContext(RightSidebarContext);
  if (!context) {
    throw new Error(
      "useRightSidebar must be used within a RightSidebarProvider"
    );
  }
  return context;
}

"use client";

import { cn } from "@/lib/utils";
import { Panel } from "./panels.config";

type RightSidebarIconBarProps = {
  panels: Panel[];
  activePanel: string | null;
  onToggle: (panelId: string) => void;
};

export function RightSidebarIconBar({
  panels,
  activePanel,
  onToggle,
}: RightSidebarIconBarProps) {
  return (
    <div className="w-14 h-full bg-background border rounded-r-lg shadow-xs flex flex-col items-center py-4 gap-1">
      {panels.map((panel) => {
        const Icon = panel.icon;
        const isActive = activePanel === panel.id;
        
        return (
          <button
            key={panel.id}
            onClick={() => onToggle(panel.id)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              isActive
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:bg-gray-200/70"
            )}
            title={panel.title}
          >
            <Icon strokeWidth={1} className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}

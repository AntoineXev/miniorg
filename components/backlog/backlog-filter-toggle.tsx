"use client";

import { Toggle } from "@/components/ui/toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

type BacklogFilterToggleProps = {
  showAllTasks: boolean;
  onShowAllTasksChange: (value: boolean) => void;
  showLabel?: boolean;
};

export function BacklogFilterToggle({ 
  showAllTasks, 
  onShowAllTasksChange,
  showLabel = true 
}: BacklogFilterToggleProps) {
  return (
    <Tooltip 
      content={showAllTasks ? "Affiche toutes les tâches (planifiées et non planifiées)" : "Affiche uniquement les tâches non planifiées"}
      side="bottom"
    >
      <span>
        <Toggle
          pressed={showAllTasks}
          onPressedChange={onShowAllTasksChange}
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          <ListFilter 
            className={cn(
              "h-3.5 w-3.5 transition-all",
              !showAllTasks && "fill-primary stroke-primary"
            )}
          />
          {showLabel && (
            <span className="text-xs">{showAllTasks ? "Toutes" : "Non planifiées"}</span>
          )}
        </Toggle>
      </span>
    </Tooltip>
  );
}

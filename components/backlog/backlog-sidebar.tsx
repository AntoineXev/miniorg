"use client";

import { useState } from "react";
import { BacklogContent } from "@/components/backlog/backlog-content";
import { BacklogFilterToggle } from "@/components/backlog/backlog-filter-toggle";

export function BacklogSidebar() {
  const [showAllTasks, setShowAllTasks] = useState(true);

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-l-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Backlog</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All your tasks, organized by deadline
            </p>
          </div>
          <BacklogFilterToggle 
            showAllTasks={showAllTasks}
            onShowAllTasksChange={setShowAllTasks}
            showLabel={false}
          />
        </div>
      </div>

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto">
        <BacklogContent 
          compact 
          showAllTasks={showAllTasks}
          onShowAllTasksChange={setShowAllTasks}
        />
      </div>
    </div>
  );
}

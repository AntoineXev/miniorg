"use client";

import { BacklogContent } from "@/components/backlog/backlog-content";

export function BacklogSidebar() {
  return (
    <div className="h-full flex flex-col overflow-hidden rounded-l-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Backlog</h2>
        <p className="text-sm text-muted-foreground mt-1">
          All your tasks, organized by deadline
        </p>
      </div>

      {/* Content with scroll */}
      <div className="flex-1 overflow-y-auto">
        <BacklogContent showQuickAdd={false} compact />
      </div>
    </div>
  );
}

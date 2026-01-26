"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddButton } from "@/components/ui/add-button";
import { DraggableTaskCard } from "@/components/tasks/draggable-task-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/api/types";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

export type DayColumnData = {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  isWeekend: boolean;
  tasks: Task[];
};

export type DayColumnProps = {
  day: DayColumnData;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateTag: (taskId: string, tagId: string | null) => void;
  onAddTask: () => void;
  onTaskDrop: (taskId: string, newDate: Date, source?: string) => void;
  isLast?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
  title?: string;
  subtitle?: string;
};

export function DayColumn({
  day,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateTag,
  onAddTask,
  onTaskDrop,
  isLast = false,
  showHeader = true,
  fullWidth = false,
  title,
  subtitle,
}: DayColumnProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ date: day.date.toISOString() }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const taskId = source.data.taskId as string;
        const taskStatus = source.data.taskStatus as string;
        const sourceLocation = source.data.source as string | undefined;

        // Only allow drop for incomplete tasks
        if (taskStatus !== "done" && taskId) {
          onTaskDrop(taskId, day.date, sourceLocation);
        }
      },
    });
  }, [day.date, onTaskDrop]);

  const totalMinutes = day.tasks.reduce((sum, task) => {
    // Only count incomplete tasks
    if (task.status === "done") return sum;
    // Use the task's duration if set, otherwise default to 30 minutes
    return sum + (task.duration || 30);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div
      ref={dropRef}
      className={cn(
        "h-full bg-background transition-all duration-200 overflow-y-auto",
        !fullWidth && "max-w-72",
        isDraggedOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
      )}
    >
      {/* Day header - sticky during scroll */}
      {showHeader && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3.5 pb-2 space-y-2.5 sticky-header-shadow">
          {/* Custom title/subtitle or default day name/number */}
          {(title || subtitle) ? (
            <div>
              {title && <h2 className="font-semibold text-base">{title}</h2>}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {day.dayName}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full font-semibold text-lg",
                  day.isToday ? "text-primary" : "text-foreground"
                )}
              >
                {day.dayNumber}
              </div>
            </div>
          )}

          {/* Add task button */}
          <AddButton
            onClick={onAddTask}
            rightContent={
              totalMinutes > 0 ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 bg-muted/10 text-muted-foreground font-medium"
                >
                  {hours > 0 && `${hours}h`}
                  {hours > 0 && minutes > 0 && ""}
                  {minutes > 0 && `${minutes}m`}
                </Badge>
              ) : undefined
            }
          >
            Add task
          </AddButton>
        </div>
      )}

      {/* Task list */}
      <div className="px-3 pt-1 py-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {day.tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdateTag={onUpdateTag}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

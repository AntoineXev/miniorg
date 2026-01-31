"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { format, isSameDay, parseISO, startOfDay, isPast } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { DraggableTaskCard } from "@/components/tasks/draggable-task-card";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useUpdateTaskWithConfirmation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/api/types";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type WrapupIncompleteColumnProps = {
  date: Date;
};

export function WrapupIncompleteColumn({ date }: WrapupIncompleteColumnProps) {
  const { data: tasks = [] } = useTasksQuery();
  const updateTask = useUpdateTaskWithConfirmation();
  const deleteTask = useDeleteTaskMutation();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const dateStart = useMemo(() => startOfDay(date), [date]);

  // Setup drop target
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ date: date.toISOString() }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const taskId = source.data.taskId as string;
        const taskStatus = source.data.taskStatus as string;

        if (taskStatus !== "done" && taskId) {
          updateTask.mutate({
            id: taskId,
            scheduledDate: date,
          });
        }
      },
    });
  }, [date, updateTask]);

  const incompleteTasks = useMemo(() => {
    // Filter incomplete tasks scheduled for today or overdue
    return tasks
      .filter((task) => {
        if (task.status === "done") return false;
        if (!task.scheduledDate) return false;
        const taskDate =
          typeof task.scheduledDate === "string"
            ? parseISO(task.scheduledDate)
            : task.scheduledDate;
        // Today or overdue (past and not today)
        return isSameDay(taskDate, date) || (isPast(taskDate) && taskDate < dateStart);
      })
      .sort((a, b) => {
        // Sort by rollupCount (most rolled over first), then by scheduled date
        const rollupDiff = (b.rollupCount || 0) - (a.rollupCount || 0);
        if (rollupDiff !== 0) return rollupDiff;

        const dateA = a.scheduledDate
          ? typeof a.scheduledDate === "string"
            ? parseISO(a.scheduledDate)
            : a.scheduledDate
          : new Date();
        const dateB = b.scheduledDate
          ? typeof b.scheduledDate === "string"
            ? parseISO(b.scheduledDate)
            : b.scheduledDate
          : new Date();
        return dateA.getTime() - dateB.getTime();
      });
  }, [tasks, date, dateStart]);

  const totalMinutes = incompleteTasks.reduce((sum, task) => sum + (task.duration || 30), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask.mutate({
      id: taskId,
      status: completed ? "done" : "",
    });
  };

  const handleDelete = (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteTask.mutate(taskId);
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateTag = (taskId: string, tagId: string | null) => {
    updateTask.mutate({
      id: taskId,
      tagId,
    } as any);
  };

  return (
    <>
      <div
        ref={dropRef}
        className={cn(
          "h-full bg-background transition-all duration-200 overflow-y-auto flex flex-col",
          isDraggedOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3.5 pb-2 space-y-2.5 sticky-header-shadow">
          <div>
            <h2 className="font-semibold text-base">Didn&apos;t get to</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""} remaining
              {totalMinutes > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 text-[10px] px-1.5 py-0 h-5 bg-muted/10 text-muted-foreground font-medium"
                >
                  {hours > 0 && `${hours}h`}
                  {hours > 0 && minutes > 0 && ""}
                  {minutes > 0 && `${minutes}m`}
                </Badge>
              )}
            </p>
          </div>
        </div>

        {/* Task list */}
        <div className="px-3 pt-1 pb-4 space-y-2.5 flex-1">
          <AnimatePresence mode="popLayout">
            {incompleteTasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdateTag={handleUpdateTag}
              />
            ))}
          </AnimatePresence>

          {incompleteTasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              All tasks completed!
            </div>
          )}
        </div>
      </div>

      <EditTaskDialog
        task={editingTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdated={() => {}}
        onTaskDeleted={() => {}}
      />
    </>
  );
}

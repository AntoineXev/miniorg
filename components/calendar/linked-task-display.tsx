"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import { useUpdateEventMutation } from "@/lib/api/mutations/calendar-events";
import type { Task, CalendarEvent } from "@/lib/api/types";

type LinkedTaskDisplayProps = {
  task: Task;
  event: CalendarEvent;
  onTaskUpdated?: (updatedTask: Task, isCompleted: boolean) => void;
  onTaskDeleted?: () => void;
  onEdit?: (task: Task) => void;
};

export function LinkedTaskDisplay({
  task,
  event,
  onTaskUpdated,
  onTaskDeleted,
  onEdit,
}: LinkedTaskDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const updateEvent = useUpdateEventMutation();

  const isDeleting = deleteTask.isPending;
  const isCompleted = task.status === "done";

  const scheduledDate = task.scheduledDate
    ? typeof task.scheduledDate === "string"
      ? new Date(task.scheduledDate)
      : task.scheduledDate
    : null;

  const handleCheckboxChange = async (checked: boolean) => {
    setIsCompleting(true);

    // Update both task and event
    const newStatus = checked ? "done" : "";

    // Optimistically call callback for immediate UI update
    const updatedTask = { ...task, status: newStatus, completedAt: checked ? new Date() : null };
    onTaskUpdated?.(updatedTask, checked);

    try {
      // Update task status
      await updateTask.mutateAsync({
        id: task.id,
        status: newStatus,
      });

      // Update event completion status
      await updateEvent.mutateAsync({
        id: event.id,
        isCompleted: checked,
      });
    } catch {
      // Revert on error
      onTaskUpdated?.(task, !checked);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;

    deleteTask.mutate(task.id, {
      onSuccess: () => {
        onTaskDeleted?.();
      },
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground mb-1.5 block">
        Linked Task
      </label>
      <div
        className="group relative flex items-start gap-3 p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0">
          <AnimatedCheckbox
            checked={isCompleted}
            onChange={handleCheckboxChange}
            disabled={isCompleting}
            size="small"
            className="w-5 h-5"
          />
        </div>

        {/* Task details */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </div>
          {scheduledDate && (
            <div className="text-xs text-foreground">
              {format(scheduledDate, "EEEE, MMM d")}
            </div>
          )}
          {task.tag && (
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${task.tag.color}20`,
                  color: task.tag.color,
                }}
                className="text-xs"
              >
                {task.tag.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Action buttons - show on hover */}
        {isHovered && !isDeleting && !isCompleting && (
          <div className="absolute right-1 top-1">
            <ButtonGroup>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ButtonGroup>
          </div>
        )}

        {/* Loading state for delete */}
        {isDeleting && (
          <div className="absolute right-2 top-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

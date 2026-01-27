"use client";

import { useMemo, useState } from "react";
import { DraggableTaskCard } from "@/components/tasks/draggable-task-card";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import { addDays, addMonths, addYears, isSameDay, parseISO, startOfDay } from "date-fns";
import type { Task } from "@/lib/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = "next_3_days" | "next_week" | "next_month" | "next_quarter" | "next_year";

const timeRangeLabels: Record<TimeRange, string> = {
  next_3_days: "3 days",
  next_week: "7 days",
  next_month: "1 month",
  next_quarter: "3 months",
  next_year: "1 year",
};

// Helper to calculate effective due date from deadlineType
function getDeadlineDate(task: Task): Date | null {
  if (task.deadlineType && task.deadlineType !== "no_date" && task.deadlineSetAt) {
    const setDate = typeof task.deadlineSetAt === "string"
      ? new Date(task.deadlineSetAt)
      : task.deadlineSetAt;

    switch (task.deadlineType) {
      case "next_3_days":
        return addDays(setDate, 3);
      case "next_week":
        return addDays(setDate, 7);
      case "next_month":
        return addMonths(setDate, 1);
      case "next_quarter":
        return addMonths(setDate, 3);
      case "next_year":
        return addYears(setDate, 1);
      default:
        return null;
    }
  }
  return null;
}

type UrgentTasksProps = {
  referenceDate: Date;
};

export function UrgentTasks({ referenceDate }: UrgentTasksProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("next_3_days");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data: tasks = [] } = useTasksQuery();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  const urgentTasks = useMemo(() => {
    const refDateStart = startOfDay(referenceDate);

    // Calculate end date based on selected time range
    let endDate: Date;
    switch (timeRange) {
      case "next_3_days":
        endDate = addDays(refDateStart, 3);
        break;
      case "next_week":
        endDate = addDays(refDateStart, 7);
        break;
      case "next_month":
        endDate = addMonths(refDateStart, 1);
        break;
      case "next_quarter":
        endDate = addMonths(refDateStart, 3);
        break;
      case "next_year":
        endDate = addYears(refDateStart, 1);
        break;
      default:
        endDate = addDays(refDateStart, 3);
    }

    return tasks.filter((task) => {
      // Exclude completed tasks
      if (task.status === "done") return false;
      // Exclude highlights
      if (task.type === "highlight") return false;

      // Get the effective due date (either scheduledDate or calculated from deadlineType)
      let dueDate: Date | null = null;

      if (task.scheduledDate) {
        dueDate = typeof task.scheduledDate === "string"
          ? parseISO(task.scheduledDate)
          : task.scheduledDate;
      } else {
        dueDate = getDeadlineDate(task);
      }

      // Must have a due date
      if (!dueDate) return false;

      // Normalize to start of day for comparison
      const dueDateNormalized = startOfDay(dueDate);

      // Exclude tasks for the reference date (they're shown in the day column)
      if (isSameDay(dueDateNormalized, refDateStart)) return false;

      // Include tasks due within selected time range after reference date
      return dueDateNormalized > refDateStart && dueDateNormalized <= endDate;
    });
  }, [tasks, referenceDate, timeRange]);

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask.mutate({
      id: taskId,
      status: completed ? "done" : "",
    });
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteTask.mutate(taskId);
  };

  const handleUpdateTag = (taskId: string, tagId: string | null) => {
    updateTask.mutate({
      id: taskId,
      tagId,
    } as any);
  };

  return (
    <>
      <div className="relative flex flex-col h-full">
        <div className="bg-background sticky top-0 z-10 flex flex-wrap justify-between items-center gap-2 pb-3">
          <h2 className="font-semibold text-base">Upcoming Tasks</h2>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="h-7 w-auto text-xs border-none bg-transparent px-2 gap-1 text-muted-foreground hover:text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(timeRangeLabels) as TimeRange[]).map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {timeRangeLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground w-full basis-full">Check your upcoming tasks and move them to the right column to add them to your day.</p>

        </div>

        {urgentTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming tasks. Nice work!
          </p>
        ) : (
          <div className="space-y-2.5 flex-1 pt-1 overflow-auto">
            {urgentTasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdateTag={handleUpdateTag}
              />
            ))}
          </div>
        )}
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

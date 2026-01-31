"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfDay, isToday } from "date-fns";
import { DayColumn, type DayColumnData } from "@/components/calendar/day-column";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useUpdateTaskWithConfirmation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import { useQuickAddTask } from "@/providers/quick-add-task";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import type { Task } from "@/lib/api/types";

type PlanningDayColumnProps = {
  date: Date;
  title?: string;
  subtitle?: string;
};

export function PlanningDayColumn({ date, title, subtitle }: PlanningDayColumnProps) {
  const { data: tasks = [] } = useTasksQuery();
  const updateTask = useUpdateTaskWithConfirmation();
  const deleteTask = useDeleteTaskMutation();
  const { openQuickAdd } = useQuickAddTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const dateStart = useMemo(() => startOfDay(date), [date]);
  const isTodayDate = isToday(date);

  const dayData = useMemo((): DayColumnData => {
    // Filter tasks for this date
    const dateTasks = tasks.filter((task) => {
      // For completed tasks, use completedAt
      if (task.status === "done") {
        if (!task.completedAt) return false;
        const completedDate =
          typeof task.completedAt === "string"
            ? parseISO(task.completedAt)
            : task.completedAt;
        return isSameDay(completedDate, date);
      }

      // For incomplete tasks, use scheduledDate
      if (!task.scheduledDate) return false;
      const taskDate =
        typeof task.scheduledDate === "string"
          ? parseISO(task.scheduledDate)
          : task.scheduledDate;
      return isSameDay(taskDate, date);
    });

    // Add overdue tasks only if planning for today
    // (highlights stay on their original date, no rollup)
    if (isTodayDate) {
      const overdueTasks = tasks.filter((task) => {
        if (!task.scheduledDate || task.status === "done") return false;
        // Exclude highlights from rollup
        if (task.type === "highlight") return false;
        const taskDate =
          typeof task.scheduledDate === "string"
            ? parseISO(task.scheduledDate)
            : task.scheduledDate;
        // Overdue = scheduled in the past and not today
        return taskDate < dateStart && !isSameDay(taskDate, date);
      });
      dateTasks.push(...overdueTasks);
    }

    // Separate incomplete and completed
    const incompleteTasks = dateTasks.filter((t) => t.status !== "done");
    const completedTasks = dateTasks.filter((t) => t.status === "done");

    // Sort incomplete tasks: highlight first, then by date
    incompleteTasks.sort((a, b) => {
      // Highlight always first
      if (a.type === "highlight") return -1;
      if (b.type === "highlight") return 1;

      // Then by scheduled date (oldest first for overdue)
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

    return {
      date,
      dayName: format(date, "EEEE"),
      dayNumber: format(date, "d"),
      isToday: isTodayDate,
      isWeekend: [0, 6].includes(date.getDay()),
      tasks: [...incompleteTasks, ...completedTasks],
    };
  }, [tasks, date, dateStart, isTodayDate]);

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask.mutate({
      id: taskId,
      status: completed ? "done" : "",
    });
  };

  const handleTaskDrop = (taskId: string, newDate: Date) => {
    updateTask.mutate({
      id: taskId,
      scheduledDate: newDate,
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

  const handleAddTask = () => {
    openQuickAdd(date);
  };

  return (
    <>
      <div className="h-full overflow-hidden flex flex-col w-full">
        <DayColumn
          day={dayData}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateTag={handleUpdateTag}
          onAddTask={handleAddTask}
          onTaskDrop={handleTaskDrop}
          fullWidth
          title={title}
          subtitle={subtitle}
        />
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

"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { DayColumn, type DayColumnData } from "@/components/calendar/day-column";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import { useQuickAddTask } from "@/providers/quick-add-task";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import type { Task } from "@/lib/api/types";

type WrapupCompletedColumnProps = {
  date: Date;
};

export function WrapupCompletedColumn({ date }: WrapupCompletedColumnProps) {
  const { data: tasks = [] } = useTasksQuery();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const { openQuickAdd } = useQuickAddTask();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const dayData = useMemo((): DayColumnData => {
    // Filter only completed tasks for this date
    const completedTasks = tasks.filter((task) => {
      if (task.status !== "done" || !task.completedAt) return false;
      const completedDate =
        typeof task.completedAt === "string"
          ? parseISO(task.completedAt)
          : task.completedAt;
      return isSameDay(completedDate, date);
    });

    // Sort by completedAt time
    completedTasks.sort((a, b) => {
      const dateA = a.completedAt
        ? typeof a.completedAt === "string"
          ? parseISO(a.completedAt)
          : a.completedAt
        : new Date();
      const dateB = b.completedAt
        ? typeof b.completedAt === "string"
          ? parseISO(b.completedAt)
          : b.completedAt
        : new Date();
      return dateA.getTime() - dateB.getTime();
    });

    return {
      date,
      dayName: format(date, "EEEE"),
      dayNumber: format(date, "d"),
      isToday: true,
      isWeekend: [0, 6].includes(date.getDay()),
      tasks: completedTasks,
    };
  }, [tasks, date]);

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask.mutate({
      id: taskId,
      status: completed ? "done" : "",
    });
  };

  const handleTaskDrop = (taskId: string, newDate: Date) => {
    // No-op for completed column - don't allow dropping
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
          title="What I've done"
          subtitle={`${dayData.tasks.length} task${dayData.tasks.length !== 1 ? "s" : ""} completed`}
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

"use client";

import { useState } from "react";
import { BacklogGroups } from "@/components/backlog/backlog-groups";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import type { Task } from "@/lib/api/types";
import { Loader } from "@/components/ui/loader";

type BacklogContentProps = {
  showHeader?: boolean;
  compact?: boolean;
  showAllTasks?: boolean;
  onShowAllTasksChange?: (value: boolean) => void;
};

export function BacklogContent({ 
  showHeader = false,
  compact = false,
  showAllTasks = true,
  onShowAllTasksChange
}: BacklogContentProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use React Query hooks
  const { data: allTasks = [], isLoading } = useTasksQuery();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  // Filter to show only backlog and planned tasks (not done)
  const tasks = allTasks.filter(
    (task: Task) => task.status === "backlog" || task.status === "planned"
  );

  // Filter tasks based on showAllTasks toggle
  const filteredTasks = showAllTasks 
    ? tasks 
    : tasks.filter(task => task.status === "backlog"); // Only unplanned tasks

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
    const task = filteredTasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setIsEditDialogOpen(true);
    }
  };

  return (
    <>
      <div className={compact ? "" : "w-full pb-20 bg-background"}>
        {isLoading ? (
          <div className="text-center py-12">
            <Loader showText text="Loading tasks" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {showAllTasks ? (
                <>
                  No tasks yet. Press{" "}
                  <kbd className="px-2 py-1 bg-secondary rounded text-xs">⌘K</kbd> to
                  create your first task.
                </>
              ) : (
                "Aucune tâche non planifiée. Toutes vos tâches sont déjà planifiées !"
              )}
            </p>
          </div>
        ) : (
          <BacklogGroups
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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

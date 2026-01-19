"use client";

import { useState, useEffect } from "react";
import { BacklogGroups } from "@/components/backlog/backlog-groups";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { onTaskUpdate, emitTaskUpdate } from "@/lib/services/task-events";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: Date | null;
  deadlineType?: string | null;
  deadlineSetAt?: Date | null;
  duration?: number | null;
  completedAt?: Date | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  createdAt: Date;
  updatedAt: Date;
};

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      // Fetch all non-completed tasks (both backlog and planned)
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        // Filter to show only backlog and planned tasks (not done)
        const activeTasks = data.filter(
          (task: Task) => task.status === "backlog" || task.status === "planned"
        );
        setTasks(activeTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks based on showAllTasks toggle
  const filteredTasks = showAllTasks 
    ? tasks 
    : tasks.filter(task => task.status === "backlog"); // Only unplanned tasks

  useEffect(() => {
    fetchTasks();
  }, []);

  // Listen for task updates from other components (e.g., calendar drag & drop)
  useEffect(() => {
    return onTaskUpdate(() => {
      fetchTasks();
    });
  }, []);

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const updatePayload: any = {
        id: taskId,
      };
      
      // Only set status when marking as done
      // When unchecking, omit status to let backend auto-determine it (backlog or planned)
      if (completed) {
        updatePayload.status = "done";
      }
      
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        fetchTasks();
        emitTaskUpdate();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTasks();
        emitTaskUpdate();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
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
            <p className="text-muted-foreground">Loading tasks...</p>
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
        onTaskUpdated={fetchTasks}
        onTaskDeleted={fetchTasks}
      />
    </>
  );
}

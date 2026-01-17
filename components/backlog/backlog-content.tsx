"use client";

import { useState, useEffect } from "react";
import { BacklogGroups } from "@/components/backlog/backlog-groups";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { onTaskUpdate, emitTaskUpdate } from "@/lib/task-events";

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
  showQuickAdd?: boolean;
  showHeader?: boolean;
  compact?: boolean;
};

export function BacklogContent({ 
  showQuickAdd = true,
  showHeader = false,
  compact = false 
}: BacklogContentProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks?status=backlog");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          status: completed ? "done" : "backlog",
        }),
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
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tasks yet. Press{" "}
              <kbd className="px-2 py-1 bg-secondary rounded text-xs">⌘K</kbd> to
              create your first task.
            </p>
          </div>
        ) : (
          <BacklogGroups
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showQuickAdd && <QuickAddTask onTaskCreated={fetchTasks} />}
      
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

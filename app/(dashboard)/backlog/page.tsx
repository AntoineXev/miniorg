"use client";

import { useState, useEffect } from "react";
import { BacklogGroups } from "@/components/backlog/backlog-groups";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  scheduledDate?: Date | null;
  deadlineType?: string | null;
  deadlineSetAt?: Date | null;
  duration?: number | null; // Duration in minutes
  completedAt?: Date | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  createdAt: Date;
  updatedAt: Date;
};

export default function BacklogPage() {
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
      <div className="container mx-auto p-6 max-w-4xl pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Backlog</h1>
          <p className="text-muted-foreground mt-1">
            All your tasks, organized by deadline
          </p>
        </div>

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

      {/* Footer hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘ K</kbd>
          {" "}to create a task anywhere in the app
        </div>
      </div>

      <QuickAddTask onTaskCreated={fetchTasks} />
      
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

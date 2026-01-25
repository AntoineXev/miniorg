"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TaskCard } from "@/components/tasks/task-card";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/api/types";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";

export type DraggableTaskCardProps = {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateTag: (taskId: string, tagId: string | null) => void;
  showTime?: boolean;
};

export function DraggableTaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateTag,
  showTime = false,
}: DraggableTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const isCompleted = task.status === "done";

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    // Don't allow drag for completed tasks
    if (isCompleted) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
          taskDuration: task.duration || 30,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: "16px",
              y: "8px",
            }),
            render: ({ container }) => {
              const preview = document.createElement("div");
              preview.className =
                "bg-card border border-primary rounded-lg p-3 shadow-xl max-w-xs";
              preview.innerHTML = `
                <div class="text-sm font-medium text-foreground">
                  ${task.title}
                </div>
              `;
              container.appendChild(preview);
            },
          });
        },
      })
    );
  }, [task.id, task.title, task.status, task.duration, isCompleted]);

  return (
    <motion.div
      ref={dragRef}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: task.status === "done" ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "transition-all duration-300",
        task.status === "done" && "opacity-40 grayscale",
        !isCompleted && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdateTag={onUpdateTag}
        showTime={showTime}
      />
    </motion.div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { cn } from "@/lib/utils";

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

type DraggableTaskWrapperProps = {
  task: Task;
  children: React.ReactNode;
};

export function DraggableTaskWrapper({ task, children }: DraggableTaskWrapperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const isCompleted = task.status === "done";

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    // Ne pas permettre le drag pour les tâches complétées
    if (isCompleted) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
          taskDuration: task.duration || 30,
          source: "backlog", // Pour identifier la source du drag
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px',
            }),
            render: ({ container }) => {
              const preview = document.createElement('div');
              preview.className = 'bg-card border-2 border-primary rounded-lg p-3 shadow-xl max-w-xs';
              preview.innerHTML = `
                <div class="text-sm font-medium text-foreground">
                  ${task.title}
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  Drop on calendar to schedule
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
    <div
      ref={dragRef}
      className={cn(
        "transition-all duration-200",
        !isCompleted && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 scale-95"
      )}
    >
      {children}
    </div>
  );
}

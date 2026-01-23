"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { cn } from "@/lib/utils";
import { DEFAULT_EVENT_DURATION_MINUTES } from "@/lib/constants/calendar";
import { useTimelineDrag } from "@/lib/contexts/timeline-drag-context";
import type { Task } from "@/lib/api/types";

type DraggableTaskWrapperProps = {
  task: Task;
  children: React.ReactNode;
};

export function DraggableTaskWrapper({ task, children }: DraggableTaskWrapperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const isCompleted = task.status === "done";
  const { isOverTimeline, setIsOverTimeline } = useTimelineDrag();

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
          taskDuration: task.duration || DEFAULT_EVENT_DURATION_MINUTES,
          source: "backlog",
        }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
        },
        onDragStart: ({ location }) => {
          setIsDragging(true);
          setMousePos({ x: location.current.input.clientX, y: location.current.input.clientY });
        },
        onDrag: ({ location }) => {
          setMousePos({ x: location.current.input.clientX, y: location.current.input.clientY });
        },
        onDrop: () => {
          setIsDragging(false);
          setIsOverTimeline(false);
        },
      })
    );
  }, [task.id, task.title, task.status, task.duration, isCompleted, setIsOverTimeline]);

  return (
    <>
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

      {/* Custom drag preview that follows cursor */}
      {isDragging && !isOverTimeline && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-none z-[9999] bg-card border-2 border-primary rounded-lg p-3 shadow-xl max-w-xs"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 8,
          }}
        >
          <div className="text-sm font-medium text-foreground">
            {task.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Drop on calendar to schedule
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfToday, isSameDay, parseISO, isWeekend } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { cn } from "@/lib/utils";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";

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

type DayColumn = {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  isWeekend: boolean;
  tasks: Task[];
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(startOfToday());
  const [numDays, setNumDays] = useState(7);
  const [triggerQuickAdd, setTriggerQuickAdd] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | undefined>();

  // Responsive: ajuster le nombre de jours selon la largeur de l'écran
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setNumDays(3);
      } else if (window.innerWidth < 1024) {
        setNumDays(5);
      } else {
        setNumDays(7);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
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
          status: completed ? "done" : "planned",
        }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleTaskDrop = async (taskId: string, newDate: Date) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          scheduledDate: newDate.toISOString(),
        }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task date:", error);
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

  const handleAddTaskToDay = (date: Date) => {
    setPrefilledDate(date);
    setTriggerQuickAdd(true);
  };

  const handleQuickAddOpenChange = (open: boolean) => {
    if (!open) {
      setTriggerQuickAdd(false);
      setPrefilledDate(undefined);
    }
  };

  // Générer les colonnes de jours
  const dayColumns: DayColumn[] = [];
  for (let i = 0; i < numDays; i++) {
    const date = addDays(startDate, i);
    const isToday = isSameDay(date, new Date());
    const isWeekendDay = isWeekend(date);

    // Filtrer les tâches pour ce jour
    const dayTasks = tasks.filter((task) => {
      if (!task.scheduledDate) return false;
      const taskDate = typeof task.scheduledDate === 'string' 
        ? parseISO(task.scheduledDate) 
        : task.scheduledDate;
      return isSameDay(taskDate, date);
    });

    // Séparer les tâches complétées et non complétées, mais GARDER LES DEUX
    const incompleteTasks = dayTasks.filter(t => t.status !== "done");
    const completedTasks = dayTasks.filter(t => t.status === "done");

    dayColumns.push({
      date,
      dayName: format(date, "EEEE"),
      dayNumber: format(date, "d"),
      isToday,
      isWeekend: isWeekendDay,
      tasks: [...incompleteTasks, ...completedTasks], // Afficher toutes les tâches
    });
  }

  const handlePrevWeek = () => {
    setStartDate(addDays(startDate, -numDays));
  };

  const handleNextWeek = () => {
    setStartDate(addDays(startDate, numDays));
  };

  const handleToday = () => {
    setStartDate(startOfToday());
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* Header avec navigation */}
        <Header title="Calendar">
          <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevWeek}
              className="h-8 w-8 p-0 hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 px-4 text-xs font-semibold hover:bg-background"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextWeek}
              className="h-8 w-8 p-0 hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Header>

        {/* Grid de jours */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="min-w-max h-full">
            <div className="grid gap-0 h-full" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(300px, 1fr))` }}>
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading calendar...</p>
                  </div>
                </div>
              ) : (
                dayColumns.map((day, index) => (
                  <DayColumn
                    key={day.date.toISOString()}
                    day={day}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddTask={() => handleAddTaskToDay(day.date)}
                    onTaskDrop={handleTaskDrop}
                    isLast={index === dayColumns.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <QuickAddTask 
        onTaskCreated={fetchTasks} 
        prefilledDate={prefilledDate}
        triggerOpen={triggerQuickAdd}
        onOpenChange={handleQuickAddOpenChange}
      />
      
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

// Composant pour une colonne de jour
type DayColumnProps = {
  day: DayColumn;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
  onTaskDrop: (taskId: string, newDate: Date) => void;
  isLast: boolean;
};

function DayColumn({ day, onToggleComplete, onEdit, onDelete, onAddTask, onTaskDrop, isLast }: DayColumnProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ date: day.date.toISOString() }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        const taskId = source.data.taskId as string;
        const taskStatus = source.data.taskStatus as string;
        
        // Ne permettre le drop que pour les tâches non complétées
        if (taskStatus !== "done" && taskId) {
          onTaskDrop(taskId, day.date);
        }
      },
    });
  }, [day.date, onTaskDrop]);

  const totalMinutes = day.tasks.reduce((sum, task) => {
    // Only count incomplete tasks
    if (task.status === "done") return sum;
    // Use the task's duration if set, otherwise default to 30 minutes
    return sum + (task.duration || 30);
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div 
      ref={dropRef}
      className={cn(
        "flex flex-col h-full bg-background transition-all duration-200",
        isDraggedOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
      )}
    >
      {/* Header du jour */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              day.isToday ? "text-primary" : "text-muted-foreground"
            )}>
              {day.dayName}
            </span>
          </div>
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full font-semibold text-lg",
            day.isToday ? "text-primary" : "text-foreground"
          )}>
            {day.dayNumber}
          </div>
        </div>
        
        {/* Temps total estimé avec meilleur style */}
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
              <span className="font-medium">
                {hours > 0 && `${hours}h`}
                {hours > 0 && minutes > 0 && " "}
                {minutes > 0 && `${minutes}min`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Liste des tâches */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {day.tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>

        {/* Bouton d'ajout de tâche */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
          whileTap={{ scale: 0.99 }}
          onClick={onAddTask}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground/70 hover:text-foreground rounded-lg transition-all border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 group"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
          <span className="font-medium">Add task</span>
        </motion.button>
      </div>
    </div>
  );
}

// Composant pour une tâche draggable
type DraggableTaskProps = {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

function DraggableTask({ task, onToggleComplete, onEdit, onDelete }: DraggableTaskProps) {
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
              `;
              container.appendChild(preview);
            },
          });
        },
      })
    );
  }, [task.id, task.title, task.status, isCompleted]);

  return (
    <motion.div
      ref={dragRef}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
        showTime={false}
      />
    </motion.div>
  );
}

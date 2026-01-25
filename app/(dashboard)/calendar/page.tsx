"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays, startOfToday, isSameDay, parseISO, isWeekend } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Header } from "@/components/layout/header";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { useTasksQuery } from "@/lib/api/queries/tasks";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/lib/api/mutations/tasks";
import type { Task } from "@/lib/api/types";
import { useQuickAddTask } from "@/providers/quick-add-task";
import { Loader } from "@/components/ui/loader";
import { DayColumn, type DayColumnData } from "@/components/calendar/day-column";

export default function CalendarPage() {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(addDays(startOfToday(), -5)); // Commencer 5 jours avant aujourd'hui
  const [numDays] = useState(11); // 5 jours avant + aujourd'hui + 5 jours après = 11 jours
  const { openQuickAdd } = useQuickAddTask();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use React Query hooks
  const { data: tasks = [], isLoading } = useTasksQuery();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();

  // Scroll vers aujourd'hui au chargement
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = 5; // Aujourd'hui est à l'index 5 (5 jours après le début)
      const columnWidth = 300; // minWidth des colonnes
      const scrollPosition = todayIndex * columnWidth; // Positionner aujourd'hui à gauche
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTask.mutate({
      id: taskId,
      status: completed ? "done" : "",
    });
  };

  const handleTaskDrop = (taskId: string, newDate: Date, source?: string) => {
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

  const handleAddTaskToDay = (date: Date) => {
    openQuickAdd(date);
  };

  // Générer les colonnes de jours
  const dayColumns: DayColumnData[] = [];
  const today = new Date();

  for (let i = 0; i < numDays; i++) {
    const date = addDays(startDate, i);
    const isToday = isSameDay(date, today);
    const isWeekendDay = isWeekend(date);

    // Filtrer les tâches pour ce jour
    // Pour les tâches complétées, utiliser completedAt au lieu de scheduledDate
    const dayTasks = tasks.filter((task) => {
      // Tâches complétées: utiliser completedAt
      if (task.status === "done") {
        if (!task.completedAt) return false;
        const completedDate = typeof task.completedAt === 'string'
          ? parseISO(task.completedAt)
          : task.completedAt;
        return isSameDay(completedDate, date);
      }

      // Tâches non complétées: utiliser scheduledDate
      if (!task.scheduledDate) return false;
      const taskDate = typeof task.scheduledDate === 'string'
        ? parseISO(task.scheduledDate)
        : task.scheduledDate;
      return isSameDay(taskDate, date);
    });

    // Si c'est aujourd'hui, ajouter aussi les tâches en retard (overdue)
    // But exclude highlights from rollup - they stay on their original date
    if (isToday) {
      const overdueTasks = tasks.filter((task) => {
        // Ne pas inclure les tâches déjà comptées pour aujourd'hui
        if (!task.scheduledDate || task.status === "done") return false;
        // Exclude highlights from rollup
        if (task.type === "highlight") return false;
        const taskDate = typeof task.scheduledDate === 'string'
          ? parseISO(task.scheduledDate)
          : task.scheduledDate;
        // Tâche en retard = scheduledDate dans le passé et pas aujourd'hui
        return taskDate < today && !isSameDay(taskDate, today);
      });
      dayTasks.push(...overdueTasks);
    }

    // Séparer les tâches complétées et non complétées, mais GARDER LES DEUX
    const incompleteTasks = dayTasks.filter(t => t.status !== "done");
    const completedTasks = dayTasks.filter(t => t.status === "done");

    // Trier les tâches incomplètes par date (overdue d'abord, les plus anciennes en premier)
    incompleteTasks.sort((a, b) => {
      const dateA = a.scheduledDate 
        ? (typeof a.scheduledDate === 'string' ? parseISO(a.scheduledDate) : a.scheduledDate)
        : new Date();
      const dateB = b.scheduledDate 
        ? (typeof b.scheduledDate === 'string' ? parseISO(b.scheduledDate) : b.scheduledDate)
        : new Date();
      return dateA.getTime() - dateB.getTime(); // Ordre croissant (plus ancien en premier)
    });

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
    setStartDate(addDays(startDate, -7));
  };

  const handleNextWeek = () => {
    setStartDate(addDays(startDate, 7));
  };

  const handleToday = () => {
    setStartDate(addDays(startOfToday(), -5));
    // Scroll vers aujourd'hui
    if (scrollContainerRef.current) {
      const todayIndex = 5;
      const columnWidth = 300;
      const scrollPosition = todayIndex * columnWidth; // Positionner aujourd'hui à gauche
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* Header avec navigation */}
        <Header 
          title="Calendar"
          actions={
            <ButtonGroup>
              <Button
                variant="ghost"
                size="xs"
                onClick={handlePrevWeek}
                aria-label="Previous week"
              >
                <ChevronLeft strokeWidth={1} className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleToday}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleNextWeek}
                aria-label="Next week"
              >
                <ChevronRight strokeWidth={1} className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          }
        />

        {/* Grid de jours */}
        <div ref={scrollContainerRef} className="flex-1 overflow-x-auto">
          <div className="min-w-max h-full">
            <div className="grid gap-0 h-full" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(300px, 1fr))` }}>
              {isLoading ? (
                <div className="col-span-full w-full h-full flex items-center justify-center">
                  <Loader showText text="Loading calendar" />
                </div>
              ) : (
                dayColumns.map((day, index) => (
                  <DayColumn
                    key={day.date.toISOString()}
                    day={day}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdateTag={handleUpdateTag}
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


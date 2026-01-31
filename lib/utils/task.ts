import { differenceInDays, differenceInMonths, differenceInYears, startOfDay, addDays } from 'date-fns';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledDate: Date | null;
  deadlineType: string | null;
  deadlineSetAt: Date | null;
  order: number;
  completedAt: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DeadlineGroup = 'overdue' | 'next_3_days' | 'next_week' | 'next_month' | 'next_quarter' | 'next_year' | 'no_date';

export function isTaskOverdue(task: Task): boolean {
  if (!task.deadlineType || !task.deadlineSetAt || task.status === 'done') {
    return false;
  }

  const now = new Date();
  const setDate = new Date(task.deadlineSetAt);

  switch (task.deadlineType) {
    case 'next_3_days':
      return differenceInDays(now, setDate) > 3;
    case 'next_week':
      return differenceInDays(now, setDate) > 7;
    case 'next_month':
      return differenceInMonths(now, setDate) > 1;
    case 'next_quarter':
      return differenceInMonths(now, setDate) > 3;
    case 'next_year':
      return differenceInYears(now, setDate) > 1;
    default:
      return false;
  }
}

export function getTaskDeadlineGroup(task: Task): DeadlineGroup {
  if (isTaskOverdue(task)) {
    return 'overdue';
  }

  // Handle specific scheduled dates
  if (task.scheduledDate && !task.deadlineType) {
    const now = new Date();
    const scheduled = new Date(task.scheduledDate);
    const daysUntil = differenceInDays(scheduled, now);
    
    if (daysUntil < 0) {
      return 'overdue';
    } else if (daysUntil <= 3) {
      return 'next_3_days';
    } else if (daysUntil <= 7) {
      return 'next_week';
    } else if (differenceInMonths(scheduled, now) <= 1) {
      return 'next_month';
    } else if (differenceInMonths(scheduled, now) <= 3) {
      return 'next_quarter';
    } else {
      return 'next_year';
    }
  }

  if (!task.deadlineType) {
    return 'no_date';
  }

  return task.deadlineType as DeadlineGroup;
}

export const deadlineTypeLabels: Record<string, string> = {
  overdue: 'Overdue',
  next_3_days: 'Next 3 Days',
  next_week: 'Next 7 Days',
  next_month: 'Next Month',
  next_quarter: 'Next Quarter',
  next_year: 'Next Year',
  no_date: 'No Date',
};

// Types for reschedule confirmation
type CalendarEventRef = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  source?: string;
};

type TaskWithEvents = {
  calendarEvents?: CalendarEventRef[];
};

/**
 * Get calendar events for today from a task (only miniorg events)
 */
export function getTodayEvents(task: TaskWithEvents): CalendarEventRef[] {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  return (task.calendarEvents || []).filter((event) => {
    // Only consider miniorg events (user-created, not external)
    if (event.source && event.source !== "miniorg") return false;

    const eventDate = new Date(event.startTime);
    return eventDate >= today && eventDate < tomorrow;
  });
}

/**
 * Check if rescheduling a task requires confirmation (has events today and moving to future)
 */
export function needsRescheduleConfirmation(
  task: TaskWithEvents,
  newDate: Date
): boolean {
  const today = startOfDay(new Date());
  const newDateStart = startOfDay(newDate);

  // Only ask if rescheduling to a future date (not today)
  const isReschedulingToFuture = newDateStart > today;
  const todayEvents = getTodayEvents(task);

  return isReschedulingToFuture && todayEvents.length > 0;
}

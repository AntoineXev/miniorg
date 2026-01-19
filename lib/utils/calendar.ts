import { format, differenceInMinutes, addMinutes, startOfDay, areIntervalsOverlapping } from 'date-fns';
import type { CalendarEvent as ApiCalendarEvent } from '@/lib/api/types';

export type TimeSlot = {
  time: Date;
  label: string;
  hour: number;
  minute: number;
};

// Re-export CalendarEvent with Date objects (for local utility functions)
export type CalendarEvent = Omit<ApiCalendarEvent, 'startTime' | 'endTime' | 'isCompleted' | 'source'> & {
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  source: "miniorg" | "google" | "outlook";
};

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
  return differenceInMinutes(endTime, startTime);
}

/**
 * Format a time range as "9:00 - 10:30"
 */
export function formatTimeRange(startTime: Date, endTime: Date): string {
  return `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
}

/**
 * Format duration in minutes to readable format (e.g., "1h 30min", "45min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Generate time slots for a day
 * @param startHour - Starting hour (e.g., 0 for midnight, 6 for 6am)
 * @param endHour - Ending hour (e.g., 24 for midnight, 22 for 10pm)
 * @param interval - Interval in minutes (default 30)
 * @param date - The date to use (default today)
 */
export function getTimeSlots(
  startHour: number = 0,
  endHour: number = 24,
  interval: number = 30,
  date: Date = new Date()
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStart = startOfDay(date);
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    const time = addMinutes(dayStart, minutes);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    
    slots.push({
      time,
      label: format(time, 'HH:mm'),
      hour,
      minute,
    });
  }

  return slots;
}

/**
 * Check if two events are conflicting (overlapping)
 */
export function isEventConflicting(event1: CalendarEvent, event2: CalendarEvent): boolean {
  if (event1.id === event2.id) return false;
  
  return areIntervalsOverlapping(
    { start: event1.startTime, end: event1.endTime },
    { start: event2.startTime, end: event2.endTime },
    { inclusive: false }
  );
}

/**
 * Get all conflicts for a given event among a list of events
 */
export function getEventConflicts(event: CalendarEvent, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(e => isEventConflicting(event, e));
}

/**
 * Calculate column layout for overlapping events (like Google Calendar)
 * Returns layout info for each event: column index and total columns in the group
 */
export function calculateEventColumns(events: CalendarEvent[]): Map<string, { column: number; totalColumns: number; groupEvents: CalendarEvent[] }> {
  const layout = new Map<string, { column: number; totalColumns: number; groupEvents: CalendarEvent[] }>();
  
  // Sort events by start time, then by duration (longer events first)
  const sortedEvents = [...events].sort((a, b) => {
    const timeDiff = a.startTime.getTime() - b.startTime.getTime();
    if (timeDiff !== 0) return timeDiff;
    // If same start time, longer events should come first
    const durationA = calculateDuration(a.startTime, a.endTime);
    const durationB = calculateDuration(b.startTime, b.endTime);
    return durationB - durationA;
  });

  // Group overlapping events
  const groups: CalendarEvent[][] = [];
  
  for (const event of sortedEvents) {
    // Find a group this event belongs to (any group where it overlaps with at least one event)
    let foundGroup = false;
    
    for (const group of groups) {
      const overlapsWithGroup = group.some(e => isEventConflicting(event, e));
      if (overlapsWithGroup) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      // Create a new group
      groups.push([event]);
    }
  }

  // For each group, assign columns
  for (const group of groups) {
    if (group.length === 1) {
      // No conflicts, takes full width
      layout.set(group[0].id, { column: 0, totalColumns: 1, groupEvents: group });
      continue;
    }

    // Sort group by start time
    const sortedGroup = [...group].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Assign columns using a greedy algorithm
    const columns: CalendarEvent[][] = [];
    
    for (const event of sortedGroup) {
      // Try to place in the first available column
      let placed = false;
      
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex];
        // Check if this event conflicts with any event in this column
        const hasConflict = column.some(e => isEventConflicting(event, e));
        
        if (!hasConflict) {
          column.push(event);
          placed = true;
          layout.set(event.id, { column: colIndex, totalColumns: columns.length, groupEvents: sortedGroup });
          break;
        }
      }
      
      if (!placed) {
        // Need a new column
        columns.push([event]);
        layout.set(event.id, { column: columns.length - 1, totalColumns: columns.length, groupEvents: sortedGroup });
      }
    }
    
    // Update totalColumns for all events in this group
    const totalColumns = columns.length;
    for (const event of sortedGroup) {
      const eventLayout = layout.get(event.id);
      if (eventLayout) {
        eventLayout.totalColumns = totalColumns;
      }
    }
  }

  return layout;
}

/**
 * Calculate the position and height of an event in a timeline grid
 * @param event - The event to position
 * @param slotHeight - Height of one time slot in pixels
 * @param slotDuration - Duration of one slot in minutes
 * @param startHour - Starting hour of the timeline
 */
export function calculateEventPosition(
  event: CalendarEvent,
  slotHeight: number,
  slotDuration: number,
  startHour: number = 0
): { top: number; height: number } {
  const dayStart = startOfDay(event.startTime);
  const startMinutesFromMidnight = differenceInMinutes(event.startTime, dayStart);
  const startMinutesFromTimelineStart = startMinutesFromMidnight - (startHour * 60);
  
  const duration = calculateDuration(event.startTime, event.endTime);
  
  const top = (startMinutesFromTimelineStart / slotDuration) * slotHeight;
  const height = (duration / slotDuration) * slotHeight;
  
  return { top, height };
}

/**
 * Get time from a Y position in the timeline
 * @param yPosition - Y coordinate in pixels
 * @param slotHeight - Height of one time slot in pixels
 * @param slotDuration - Duration of one slot in minutes
 * @param startHour - Starting hour of the timeline
 * @param date - The date to use
 */
export function getTimeFromPosition(
  yPosition: number,
  slotHeight: number,
  slotDuration: number,
  startHour: number,
  date: Date
): Date {
  const slotIndex = Math.floor(yPosition / slotHeight);
  const minutesFromStart = slotIndex * slotDuration;
  const totalMinutes = (startHour * 60) + minutesFromStart;
  
  const dayStart = startOfDay(date);
  return addMinutes(dayStart, totalMinutes);
}

/**
 * Snap time to the nearest interval (rounds UP to next interval)
 * @param time - The time to snap
 * @param interval - Interval in minutes (default 15)
 */
export function snapToInterval(time: Date, interval: number = 15): Date {
  const minutes = time.getHours() * 60 + time.getMinutes();
  const snapped = Math.ceil(minutes / interval) * interval;
  
  const dayStart = startOfDay(time);
  return addMinutes(dayStart, snapped);
}

/**
 * Check if a time is within working hours
 */
export function isWorkingHours(time: Date, startHour: number = 8, endHour: number = 18): boolean {
  const hour = time.getHours();
  return hour >= startHour && hour < endHour;
}

/**
 * Calculate total duration of events in minutes
 */
export function calculateTotalDuration(events: CalendarEvent[]): number {
  return events.reduce((total, event) => {
    return total + calculateDuration(event.startTime, event.endTime);
  }, 0);
}

/**
 * Sort events by start time
 */
export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Find the next available time slot without conflicts
 * @param events - Existing events
 * @param duration - Duration needed in minutes
 * @param startFrom - Start searching from this time
 * @param slotInterval - Interval to check in minutes
 */
export function findNextAvailableSlot(
  events: CalendarEvent[],
  duration: number,
  startFrom: Date,
  slotInterval: number = 30
): Date | null {
  const maxAttempts = 48; // Check up to 24 hours (48 * 30min)
  let currentTime = snapToInterval(startFrom, slotInterval);
  
  for (let i = 0; i < maxAttempts; i++) {
    const proposedEnd = addMinutes(currentTime, duration);
    const proposedEvent: CalendarEvent = {
      id: 'temp',
      title: 'temp',
      startTime: currentTime,
      endTime: proposedEnd,
      isCompleted: false,
      source: 'miniorg',
    };
    
    const hasConflict = events.some(event => isEventConflicting(proposedEvent, event));
    
    if (!hasConflict) {
      return currentTime;
    }
    
    currentTime = addMinutes(currentTime, slotInterval);
  }
  
  return null;
}

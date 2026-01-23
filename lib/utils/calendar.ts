import { format, differenceInMinutes } from 'date-fns';

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

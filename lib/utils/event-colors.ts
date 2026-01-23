/**
 * Centralized event color utilities
 * Used by FullCalendar timeline and EventCard components
 */

/** Primary color for task-linked events */
export const EVENT_COLOR_TASK = "hsl(17, 78%, 62%)";

/** Default color for events without a specific color */
export const EVENT_COLOR_DEFAULT = "#9ca3af";

/** Opacity values for event backgrounds */
export const EVENT_OPACITY = {
  /** Future events background opacity */
  FUTURE: 0.9,
  /** Past events background opacity */
  PAST: 0.5,
} as const;

type EventColorInput = {
  taskId?: string | null;
  color?: string | null;
};

/**
 * Get the base color for an event
 * - Task-linked events use the primary color
 * - Other events use their own color or the default gray
 */
export function getEventColor(event: EventColorInput): string {
  return event.taskId ? EVENT_COLOR_TASK : (event.color || EVENT_COLOR_DEFAULT);
}

/**
 * Get the background color with appropriate alpha for an event
 * @param event - Event with taskId and color properties
 * @param isPast - Whether the event is in the past
 */
export function getEventBackgroundColor(
  event: EventColorInput,
  isPast: boolean
): string {
  const opacity = isPast ? EVENT_OPACITY.PAST : EVENT_OPACITY.FUTURE;

  if (event.taskId) {
    return `hsla(17, 78%, 62%, ${opacity})`;
  }

  const baseColor = event.color || EVENT_COLOR_DEFAULT;
  // Convert opacity to hex (0.9 = E6, 0.5 = 80)
  const hexOpacity = isPast ? '80' : 'E6';
  return `${baseColor}${hexOpacity}`;
}

/**
 * Get a light background color for event cards (10% opacity)
 */
export function getEventLightBackground(event: EventColorInput): string {
  const baseColor = getEventColor(event);
  return `${baseColor}10`;
}

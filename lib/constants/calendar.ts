/**
 * Calendar and timeline configuration constants
 */

/** Height of one time slot in pixels (for 30-minute slots) */
export const SLOT_HEIGHT_PX = 32;

/** Duration of one slot in minutes */
export const SLOT_DURATION_MINUTES = 30;

/** Snap interval for drag operations in minutes */
export const SNAP_INTERVAL_MINUTES = 5;

/** Default start hour for day view (6 AM) */
export const DAY_START_HOUR = 6;

/** Default end hour for day view (10 PM) */
export const DAY_END_HOUR = 22;

/** Default event duration when not specified (in minutes) */
export const DEFAULT_EVENT_DURATION_MINUTES = 30;

/** Minimum height for an event card in pixels */
export const MIN_EVENT_HEIGHT_PX = 24;

/** Duration threshold in minutes below which event is considered "compact" */
export const COMPACT_EVENT_THRESHOLD_MINUTES = 45;

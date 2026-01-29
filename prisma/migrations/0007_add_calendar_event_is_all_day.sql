-- Add isAllDay column to CalendarEvent
ALTER TABLE CalendarEvent ADD COLUMN isAllDay INTEGER NOT NULL DEFAULT 0;

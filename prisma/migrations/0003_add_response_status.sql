-- Migration number: 0003 	 2026-01-27
-- Add responseStatus field to CalendarEvent for tracking user's RSVP status

ALTER TABLE CalendarEvent ADD COLUMN responseStatus TEXT;

-- ============================================
-- Add missing sync columns to CalendarEvent
-- ============================================

-- Add connectionId column
ALTER TABLE "CalendarEvent" ADD COLUMN "connectionId" TEXT;

-- Add lastSyncedAt column
ALTER TABLE "CalendarEvent" ADD COLUMN "lastSyncedAt" DATETIME;

-- Add syncStatus column
ALTER TABLE "CalendarEvent" ADD COLUMN "syncStatus" TEXT;

-- Add syncError column
ALTER TABLE "CalendarEvent" ADD COLUMN "syncError" TEXT;

-- Add foreign key constraint (note: SQLite needs to be rebuilt for FK constraints on existing tables)
-- For now we'll just add the column. The constraint is enforced by Prisma at the application level.

-- Create the missing index for connectionId
CREATE INDEX IF NOT EXISTS "CalendarEvent_connectionId_idx" ON "CalendarEvent"("connectionId");

-- Create the missing unique index for externalId + connectionId
CREATE UNIQUE INDEX IF NOT EXISTS "CalendarEvent_externalId_connectionId_key" ON "CalendarEvent"("externalId", "connectionId");

-- Create CalendarConnection table
CREATE TABLE IF NOT EXISTS "CalendarConnection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" DATETIME,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isExportTarget" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncAt" DATETIME,
  "syncToken" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for CalendarConnection
CREATE UNIQUE INDEX "CalendarConnection_userId_provider_calendarId_key" ON "CalendarConnection"("userId", "provider", "calendarId");
CREATE INDEX "CalendarConnection_userId_isActive_idx" ON "CalendarConnection"("userId", "isActive");

-- Add new columns to CalendarEvent (only if they don't exist)
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE ADD COLUMN, so we'll check first
-- For now, we'll attempt to add them and handle errors gracefully

-- Add connectionId column
ALTER TABLE "CalendarEvent" ADD COLUMN "connectionId" TEXT;

-- Add lastSyncedAt column
ALTER TABLE "CalendarEvent" ADD COLUMN "lastSyncedAt" DATETIME;

-- Add syncStatus column
ALTER TABLE "CalendarEvent" ADD COLUMN "syncStatus" TEXT;

-- Add syncError column
ALTER TABLE "CalendarEvent" ADD COLUMN "syncError" TEXT;

-- Create new indexes for CalendarEvent
CREATE INDEX "CalendarEvent_externalId_idx" ON "CalendarEvent"("externalId");
CREATE INDEX "CalendarEvent_connectionId_idx" ON "CalendarEvent"("connectionId");
CREATE UNIQUE INDEX "CalendarEvent_externalId_connectionId_key" ON "CalendarEvent"("externalId", "connectionId");


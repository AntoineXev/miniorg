-- Add type column to Task table
ALTER TABLE "Task" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'normal';

-- Create index for Task type
CREATE INDEX "Task_userId_type_scheduledDate_idx" ON "Task"("userId", "type", "scheduledDate");

-- Create DailyRitual table
CREATE TABLE "DailyRitual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "highlightId" TEXT,
    "timeline" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyRitual_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyRitual_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for DailyRitual
CREATE UNIQUE INDEX "DailyRitual_userId_date_key" ON "DailyRitual"("userId", "date");
CREATE INDEX "DailyRitual_userId_date_idx" ON "DailyRitual"("userId", "date");

-- Add rollupCount column to Task table
ALTER TABLE "Task" ADD COLUMN "rollupCount" INTEGER NOT NULL DEFAULT 0;

-- Add notes and wrapupCompletedAt columns to DailyRitual table
ALTER TABLE "DailyRitual" ADD COLUMN "notes" TEXT;
ALTER TABLE "DailyRitual" ADD COLUMN "wrapupCompletedAt" DATETIME;

-- Add ritual mode setting to User
ALTER TABLE "User" ADD COLUMN "ritualMode" TEXT NOT NULL DEFAULT 'separate';

-- Add autoMoveEventsOnComplete setting to User table
ALTER TABLE "User" ADD COLUMN "autoMoveEventsOnComplete" BOOLEAN NOT NULL DEFAULT true;

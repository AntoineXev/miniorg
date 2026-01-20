-- Migration number: 0001 	 2026-01-20T14:29:01.277Z
-- Add tag hierarchy fields for channels and sub-channels
-- Change task-tag relation from many-to-many to one-to-many

-- Drop the many-to-many join table
DROP TABLE IF EXISTS _TaskTags;

-- Add tag hierarchy fields to Tag
ALTER TABLE Tag ADD COLUMN isPersonal INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Tag ADD COLUMN isDefault INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Tag ADD COLUMN parentId TEXT;

-- Add single tagId to Task
ALTER TABLE Task ADD COLUMN tagId TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS Tag_userId_parentId_idx ON Tag(userId, parentId);
CREATE INDEX IF NOT EXISTS Task_tagId_idx ON Task(tagId);

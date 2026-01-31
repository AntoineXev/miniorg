-- Add password field to User table for email/password authentication
ALTER TABLE User ADD COLUMN password TEXT;

-- Add type field to VerificationToken for distinguishing email verification from password reset
ALTER TABLE VerificationToken ADD COLUMN type TEXT NOT NULL DEFAULT 'email';

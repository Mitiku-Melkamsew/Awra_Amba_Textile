-- Add token_version column to users for immediate JWT revocation on deactivation, role changes, and password resets
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

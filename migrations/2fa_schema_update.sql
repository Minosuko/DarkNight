-- 2FA Schema Update
-- Run this migration to update the twofactorauth table for the new 2FA system.

-- Modify auth_key to store Base32 secret (string instead of int)
ALTER TABLE `twofactorauth` 
    MODIFY `auth_key` VARCHAR(32) NOT NULL;

-- Add is_enabled column if it doesn't exist
ALTER TABLE `twofactorauth` 
    ADD COLUMN IF NOT EXISTS `is_enabled` TINYINT(1) NOT NULL DEFAULT 0;

-- Add backup_codes column for recovery (optional)
ALTER TABLE `twofactorauth` 
    ADD COLUMN IF NOT EXISTS `backup_codes` TEXT NULL;

-- Add unique constraint on user_id to prevent duplicates
ALTER TABLE `twofactorauth` 
    ADD UNIQUE INDEX IF NOT EXISTS `user_id_unique` (`user_id`);

-- Migration: Add general reminder functionality
-- Run this SQL in your Supabase SQL editor if you have an existing database

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enable_general_reminders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS general_reminder_minutes INTEGER DEFAULT 120;

-- Update existing users to have the default values
UPDATE profiles 
SET 
  enable_general_reminders = FALSE,
  general_reminder_minutes = 120
WHERE 
  enable_general_reminders IS NULL 
  OR general_reminder_minutes IS NULL;
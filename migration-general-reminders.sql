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

-- Create scheduled_reminders table for server-side notifications
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reading_id UUID REFERENCES readings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('general', 'post_meal_30', 'post_meal_90')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  notification_payload JSONB NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on scheduled_reminders
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_reminders
CREATE POLICY "Users can view own scheduled reminders" ON scheduled_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled reminders" ON scheduled_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled reminders" ON scheduled_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scheduled reminders" ON scheduled_reminders FOR DELETE USING (auth.uid() = user_id);

-- Service role policy for the Edge Function to send notifications
CREATE POLICY "Service role can update sent status" ON scheduled_reminders FOR UPDATE USING (true);

-- Create index for efficient querying of due reminders
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_due ON scheduled_reminders(scheduled_for, sent) WHERE sent = FALSE;
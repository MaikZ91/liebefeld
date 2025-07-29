-- Add new columns to user_challenges table for MIA coaching
ALTER TABLE public.user_challenges 
ADD COLUMN IF NOT EXISTS mia_tip TEXT,
ADD COLUMN IF NOT EXISTS week_number INTEGER,
ADD COLUMN IF NOT EXISTS week_theme TEXT;
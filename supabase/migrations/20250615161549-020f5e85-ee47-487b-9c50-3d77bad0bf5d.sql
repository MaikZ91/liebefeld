
-- Add city column to community_events table
ALTER TABLE public.community_events
ADD COLUMN city TEXT;

-- Update existing events to have a default city of "Bielefeld"
UPDATE public.community_events
SET city = 'Bielefeld'
WHERE city IS NULL;

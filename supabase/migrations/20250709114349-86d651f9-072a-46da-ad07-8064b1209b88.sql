-- Add liked_by_users column to community_events table
ALTER TABLE public.community_events 
ADD COLUMN liked_by_users JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on liked_by_users queries
CREATE INDEX idx_community_events_liked_by_users ON public.community_events USING GIN(liked_by_users);

-- Update existing events to have empty liked_by_users array
UPDATE public.community_events 
SET liked_by_users = '[]'::jsonb 
WHERE liked_by_users IS NULL;
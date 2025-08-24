-- Drop the event_likes table and all dependent objects with CASCADE
DROP TABLE IF EXISTS public.event_likes CASCADE;

-- Add RLS policy to allow updates to community_events for likes
CREATE POLICY "Allow anonymous updates for likes and liked_by_users" 
ON public.community_events 
FOR UPDATE 
USING (true)
WITH CHECK (true);
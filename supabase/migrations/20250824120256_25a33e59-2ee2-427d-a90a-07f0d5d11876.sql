-- Drop the event_likes table and related functions/triggers
DROP TABLE IF EXISTS public.event_likes CASCADE;

-- Drop functions that were specific to event_likes
DROP FUNCTION IF EXISTS public.get_event_like_count(uuid);
DROP FUNCTION IF EXISTS public.has_user_liked_event(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_event_likes_count();
DROP FUNCTION IF EXISTS public.set_initial_event_likes_count();

-- Add RLS policy to allow updates to community_events for likes
CREATE POLICY "Allow anonymous updates for likes and liked_by_users" 
ON public.community_events 
FOR UPDATE 
USING (true)
WITH CHECK (true);
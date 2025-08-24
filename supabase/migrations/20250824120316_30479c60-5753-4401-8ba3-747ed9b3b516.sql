-- Drop triggers first, then functions, then table
DROP TRIGGER IF EXISTS set_event_likes_count_on_insert ON public.community_events;
DROP TRIGGER IF EXISTS set_event_likes_count_on_update ON public.community_events;
DROP TRIGGER IF EXISTS update_event_likes_count_trigger ON public.event_likes;

-- Drop functions that were specific to event_likes
DROP FUNCTION IF EXISTS public.get_event_like_count(uuid);
DROP FUNCTION IF EXISTS public.has_user_liked_event(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_event_likes_count();
DROP FUNCTION IF EXISTS public.set_initial_event_likes_count();

-- Drop the event_likes table
DROP TABLE IF EXISTS public.event_likes CASCADE;

-- Add RLS policy to allow updates to community_events for likes
CREATE POLICY "Allow anonymous updates for likes and liked_by_users" 
ON public.community_events 
FOR UPDATE 
USING (true)
WITH CHECK (true);
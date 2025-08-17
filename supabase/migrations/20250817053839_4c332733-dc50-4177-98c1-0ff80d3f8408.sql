-- Fix existing like count mismatches
UPDATE community_events 
SET likes = (
  SELECT COUNT(*) 
  FROM event_likes 
  WHERE event_likes.event_id = community_events.id
);

-- Create a trigger to ensure new events get correct like counts when inserted
CREATE OR REPLACE FUNCTION public.set_initial_event_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the likes count based on existing event_likes
  NEW.likes = (
    SELECT COUNT(*) 
    FROM public.event_likes 
    WHERE event_id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for INSERT operations on community_events
DROP TRIGGER IF EXISTS set_event_likes_count_on_insert ON public.community_events;
CREATE TRIGGER set_event_likes_count_on_insert
  BEFORE INSERT ON public.community_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_initial_event_likes_count();

-- Add trigger for UPDATE operations on community_events to maintain consistency
DROP TRIGGER IF EXISTS set_event_likes_count_on_update ON public.community_events;
CREATE TRIGGER set_event_likes_count_on_update
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_initial_event_likes_count();
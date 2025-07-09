-- Create table to track individual event likes
CREATE TABLE public.event_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- nullable for anonymous likes
  username TEXT, -- for display purposes, nullable for anonymous
  avatar_url TEXT, -- for display purposes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id) -- prevent duplicate likes from same user
);

-- Enable RLS
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Policy for reading likes (everyone can see)
CREATE POLICY "Anyone can read event likes" 
ON public.event_likes 
FOR SELECT 
USING (true);

-- Policy for inserting likes
CREATE POLICY "Anyone can create event likes" 
ON public.event_likes 
FOR INSERT 
WITH CHECK (true);

-- Policy for deleting likes (only own likes)
CREATE POLICY "Users can delete their own likes" 
ON public.event_likes 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Create index for better performance
CREATE INDEX idx_event_likes_event_id ON public.event_likes(event_id);
CREATE INDEX idx_event_likes_user_id ON public.event_likes(user_id);

-- Function to get like count for an event
CREATE OR REPLACE FUNCTION public.get_event_like_count(event_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.event_likes
  WHERE event_id = event_uuid;
$$;

-- Function to check if user has liked an event
CREATE OR REPLACE FUNCTION public.has_user_liked_event(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.event_likes
    WHERE event_id = event_uuid AND user_id = user_uuid
  );
$$;

-- Update community_events table to have a computed likes column based on event_likes table
-- We'll keep the existing likes column for backward compatibility but it should be updated via triggers

-- Trigger function to update event likes count
CREATE OR REPLACE FUNCTION public.update_event_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_events 
    SET likes = (SELECT COUNT(*) FROM public.event_likes WHERE event_id = NEW.event_id)
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_events 
    SET likes = (SELECT COUNT(*) FROM public.event_likes WHERE event_id = OLD.event_id)
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers to automatically update likes count
CREATE TRIGGER update_event_likes_count_on_insert
  AFTER INSERT ON public.event_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_likes_count();

CREATE TRIGGER update_event_likes_count_on_delete
  AFTER DELETE ON public.event_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_likes_count();
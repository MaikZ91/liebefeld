-- Enable Row Level Security for community_events table
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Synchronize likes column with actual liked_by_users count
UPDATE public.community_events 
SET likes = (
  CASE 
    WHEN liked_by_users IS NULL THEN 0
    ELSE jsonb_array_length(liked_by_users)
  END
)
WHERE likes != (
  CASE 
    WHEN liked_by_users IS NULL THEN 0
    ELSE jsonb_array_length(liked_by_users)
  END
);
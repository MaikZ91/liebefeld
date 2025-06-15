
-- Disable Row Level Security on the community_events table
ALTER TABLE public.community_events DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the table to ensure a clean state
DROP POLICY IF EXISTS "Allow public read access" ON public.community_events;
DROP POLICY IF EXISTS "Allow public update for likes" ON public.community_events;
DROP POLICY IF EXISTS "Allow anyone to update events (for likes)" ON public.community_events;
DROP POLICY IF EXISTS "Benutzer können ihre eigenen Events bearbeiten" ON public.community_events;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.community_events;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.community_events;

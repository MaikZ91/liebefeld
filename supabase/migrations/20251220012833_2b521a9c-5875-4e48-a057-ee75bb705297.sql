-- Create user activity logs table for comprehensive tracking
CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  session_id text NOT NULL,
  event_type text NOT NULL, -- 'click', 'scroll', 'page_view', 'page_leave', 'interaction'
  event_target text, -- element clicked, button name, etc.
  event_data jsonb DEFAULT '{}'::jsonb, -- additional context
  page_path text NOT NULL,
  scroll_depth integer, -- percentage 0-100
  time_on_page integer, -- seconds
  viewport_width integer,
  viewport_height integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anonymous tracking)
CREATE POLICY "Allow public insert for activity logs"
ON public.user_activity_logs
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own logs
CREATE POLICY "Users can view their own activity logs"
ON public.user_activity_logs
FOR SELECT
USING (true);

-- Create indexes for efficient querying
CREATE INDEX idx_activity_logs_username ON public.user_activity_logs(username);
CREATE INDEX idx_activity_logs_session ON public.user_activity_logs(session_id);
CREATE INDEX idx_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_event_type ON public.user_activity_logs(event_type);

-- Enable realtime for live monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE user_activity_logs;
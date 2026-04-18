CREATE TABLE public.onboarding_funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  step TEXT NOT NULL,
  name TEXT,
  interests TEXT[],
  referrer TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
ON public.onboarding_funnel_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read funnel events"
ON public.onboarding_funnel_events
FOR SELECT
USING (true);

CREATE INDEX idx_onboarding_funnel_session ON public.onboarding_funnel_events(session_id);
CREATE INDEX idx_onboarding_funnel_created ON public.onboarding_funnel_events(created_at DESC);
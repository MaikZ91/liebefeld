-- Create user_challenges table for tracking daily challenges
CREATE TABLE public.user_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  challenge_text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date),
  UNIQUE(username, date)
);

-- Create user_levels table for EP/level tracking
CREATE TABLE public.user_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  current_ep integer NOT NULL DEFAULT 1,
  challenges_completed_this_level integer NOT NULL DEFAULT 0,
  total_challenges_completed integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_completed_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_challenges
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_levels
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Create policies for user_challenges
CREATE POLICY "Users can view their own challenges" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can create their own challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own challenges" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create policies for user_levels
CREATE POLICY "Users can view their own levels" 
ON public.user_levels 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can create their own levels" 
ON public.user_levels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own levels" 
ON public.user_levels 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_levels_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_levels_updated_at
BEFORE UPDATE ON public.user_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_user_levels_updated_at_column();

-- Add coaching_enabled field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN coaching_enabled boolean DEFAULT false;
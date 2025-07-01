
-- Create a table to cache geocoded coordinates
CREATE TABLE public.location_coordinates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Create unique constraint to prevent duplicates
  UNIQUE(location, city)
);

-- Add index for faster lookups
CREATE INDEX idx_location_coordinates_lookup ON public.location_coordinates(location, city);

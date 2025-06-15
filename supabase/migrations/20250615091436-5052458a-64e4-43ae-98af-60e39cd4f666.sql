
-- Add the new image_url column
ALTER TABLE public.community_events ADD COLUMN image_url TEXT;

-- Copy the first URL from the old array to the new column if it exists
UPDATE public.community_events
SET image_url = image_urls[1]
WHERE image_urls IS NOT NULL AND array_length(image_urls, 1) > 0;

-- Remove the old image_urls column
ALTER TABLE public.community_events DROP COLUMN image_urls;

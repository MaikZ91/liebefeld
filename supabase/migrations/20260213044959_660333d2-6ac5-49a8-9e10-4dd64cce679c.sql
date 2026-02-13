-- Remove duplicate TRIBE events, keeping only 1 per date per title pattern
DELETE FROM community_events
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY date, 
             CASE 
               WHEN title ILIKE '%KENNENLERNABEND%' THEN 'kennenlernabend'
               WHEN title ILIKE '%TUESDAY RUN%' THEN 'tuesday_run'
             END
             ORDER BY created_at ASC
           ) as rn
    FROM community_events
    WHERE title ILIKE '%TRIBE KENNENLERNABEND%' 
       OR title ILIKE '%TRIBE TUESDAY RUN%'
       OR title ILIKE '%tribe stammtisch%'
  ) dupes
  WHERE rn > 1
);
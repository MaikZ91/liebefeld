
-- 1. Drop existing foreign key to allow column type change
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_group_id_fkey;

-- 2. Clear all data from chat tables to ensure a clean state
TRUNCATE public.chat_groups, public.chat_messages RESTART IDENTITY;

-- 3. Change the ID column types from UUID to TEXT
ALTER TABLE public.chat_groups ALTER COLUMN id TYPE text;
ALTER TABLE public.chat_messages ALTER COLUMN group_id TYPE text;

-- 4. Re-add the foreign key constraint with the new TEXT type
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_group_id_fkey
FOREIGN KEY (group_id) REFERENCES public.chat_groups(id) ON DELETE CASCADE;

-- 5. Re-populate the chat_groups table with simple, readable string IDs
-- The IDs now follow the pattern: city_abbreviation_category (e.g., 'bi_sport')

INSERT INTO chat_groups (id, name, description) VALUES
  ('bi_kreativität', 'Kreativität • Bielefeld', 'Community-Chat für Kreativität in Bielefeld'),
  ('bi_ausgehen', 'Ausgehen • Bielefeld', 'Community-Chat für Ausgehen in Bielefeld'),
  ('bi_sport', 'Sport • Bielefeld', 'Community-Chat für Sport in Bielefeld'),
  ('berlin_kreativität', 'Kreativität • Berlin', 'Community-Chat für Kreativität in Berlin'),
  ('berlin_ausgehen', 'Ausgehen • Berlin', 'Community-Chat für Ausgehen in Berlin'),
  ('berlin_sport', 'Sport • Berlin', 'Community-Chat für Sport in Berlin'),
  ('bremen_kreativität', 'Kreativität • Bremen', 'Community-Chat für Kreativität in Bremen'),
  ('bremen_ausgehen', 'Ausgehen • Bremen', 'Community-Chat für Ausgehen in Bremen'),
  ('bremen_sport', 'Sport • Bremen', 'Community-Chat für Sport in Bremen'),
  ('dortmund_kreativität', 'Kreativität • Dortmund', 'Community-Chat für Kreativität in Dortmund'),
  ('dortmund_ausgehen', 'Ausgehen • Dortmund', 'Community-Chat für Ausgehen in Dortmund'),
  ('dortmund_sport', 'Sport • Dortmund', 'Community-Chat für Sport in Dortmund'),
  ('dresden_kreativität', 'Kreativität • Dresden', 'Community-Chat für Kreativität in Dresden'),
  ('dresden_ausgehen', 'Ausgehen • Dresden', 'Community-Chat für Ausgehen in Dresden'),
  ('dresden_sport', 'Sport • Dresden', 'Community-Chat für Sport in Dresden'),
  ('düsseldorf_kreativität', 'Kreativität • Düsseldorf', 'Community-Chat für Kreativität in Düsseldorf'),
  ('düsseldorf_ausgehen', 'Ausgehen • Düsseldorf', 'Community-Chat für Ausgehen in Düsseldorf'),
  ('düsseldorf_sport', 'Sport • Düsseldorf', 'Community-Chat für Sport in Düsseldorf'),
  ('essen_kreativität', 'Kreativität • Essen', 'Community-Chat für Kreativität in Essen'),
  ('essen_ausgehen', 'Ausgehen • Essen', 'Community-Chat für Ausgehen in Essen'),
  ('essen_sport', 'Sport • Essen', 'Community-Chat für Sport in Essen'),
  ('frankfurt_kreativität', 'Kreativität • Frankfurt', 'Community-Chat für Kreativität in Frankfurt'),
  ('frankfurt_ausgehen', 'Ausgehen • Frankfurt', 'Community-Chat für Ausgehen in Frankfurt'),
  ('frankfurt_sport', 'Sport • Frankfurt', 'Community-Chat für Sport in Frankfurt'),
  ('hamburg_kreativität', 'Kreativität • Hamburg', 'Community-Chat für Kreativität in Hamburg'),
  ('hamburg_ausgehen', 'Ausgehen • Hamburg', 'Community-Chat für Ausgehen in Hamburg'),
  ('hamburg_sport', 'Sport • Hamburg', 'Community-Chat für Sport in Hamburg'),
  ('hannover_kreativität', 'Kreativität • Hannover', 'Community-Chat für Kreativität in Hannover'),
  ('hannover_ausgehen', 'Ausgehen • Hannover', 'Community-Chat für Ausgehen in Hannover'),
  ('hannover_sport', 'Sport • Hannover', 'Community-Chat für Sport in Hannover'),
  ('köln_kreativität', 'Kreativität • Köln', 'Community-Chat für Kreativität in Köln'),
  ('köln_ausgehen', 'Ausgehen • Köln', 'Community-Chat für Ausgehen in Köln'),
  ('köln_sport', 'Sport • Köln', 'Community-Chat für Sport in Köln'),
  ('leipzig_kreativität', 'Kreativität • Leipzig', 'Community-Chat für Kreativität in Leipzig'),
  ('leipzig_ausgehen', 'Ausgehen • Leipzig', 'Community-Chat für Ausgehen in Leipzig'),
  ('leipzig_sport', 'Sport • Leipzig', 'Community-Chat für Sport in Leipzig'),
  ('lübeck_kreativität', 'Kreativität • Lübeck', 'Community-Chat für Kreativität in Lübeck'),
  ('lübeck_ausgehen', 'Ausgehen • Lübeck', 'Community-Chat für Ausgehen in Lübeck'),
  ('lübeck_sport', 'Sport • Lübeck', 'Community-Chat für Sport in Lübeck'),
  ('münchen_kreativität', 'Kreativität • München', 'Community-Chat für Kreativität in München'),
  ('münchen_ausgehen', 'Ausgehen • München', 'Community-Chat für Ausgehen in München'),
  ('münchen_sport', 'Sport • München', 'Community-Chat für Sport in München'),
  ('münster_kreativität', 'Kreativität • Münster', 'Community-Chat für Kreativität in Münster'),
  ('münster_ausgehen', 'Ausgehen • Münster', 'Community-Chat für Ausgehen in Münster'),
  ('münster_sport', 'Sport • Münster', 'Community-Chat für Sport in Münster'),
  ('nürnberg_kreativität', 'Kreativität • Nürnberg', 'Community-Chat für Kreativität in Nürnberg'),
  ('nürnberg_ausgehen', 'Ausgehen • Nürnberg', 'Community-Chat für Ausgehen in Nürnberg'),
  ('nürnberg_sport', 'Sport • Nürnberg', 'Community-Chat für Sport in Nürnberg'),
  ('stuttgart_kreativität', 'Kreativität • Stuttgart', 'Community-Chat für Kreativität in Stuttgart'),
  ('stuttgart_ausgehen', 'Ausgehen • Stuttgart', 'Community-Chat für Ausgehen in Stuttgart'),
  ('stuttgart_sport', 'Sport • Stuttgart', 'Community-Chat für Sport in Stuttgart')
ON CONFLICT (id) DO NOTHING;


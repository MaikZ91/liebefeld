INSERT INTO chat_messages (
  group_id,
  sender,
  text,
  poll_question,
  poll_options,
  poll_votes,
  avatar
) VALUES (
  'ausgehen-bielefeld',
  'TestUser',
  'Umfrage: Was ist euer Lieblingsgetränk?',
  'Was ist euer Lieblingsgetränk?',
  '["Bier", "Wein", "Cocktails", "Softdrinks"]'::jsonb,
  '{}'::jsonb,
  '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png'
);
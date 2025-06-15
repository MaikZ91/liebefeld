
-- Lösche alle bestehenden Chat-Gruppen (Achtung: Datenverlust!)
DELETE FROM chat_groups;

-- Stadt-Liste und Kategorien
-- Die UUIDs werden exakt wie im Frontend mit dem Pattern `${cityAbbr.toLowerCase()}_${category.toLowerCase()}` mit dem Namespace '6ba7b810-9dad-11d1-80b4-00c04fd430c8' generiert.
-- Siehe Skript: scripts/generateGroupUUIDs.js und createCitySpecificGroupId

-- Bielefeld
INSERT INTO chat_groups (id, name, description) VALUES
  ('bcf0cb55-8c56-558b-8b1e-0e4c921219e0', 'Kreativität • Bielefeld', 'Community-Chat für Kreativität in Bielefeld'),
  ('1d3e69cc-01ed-52e9-aa7d-c5ae11ef8415', 'Ausgehen • Bielefeld', 'Community-Chat für Ausgehen in Bielefeld'),
  ('0638809a-0382-5ac5-94da-5acd210c2d10', 'Sport • Bielefeld', 'Community-Chat für Sport in Bielefeld')
ON CONFLICT (id) DO NOTHING;

-- Berlin
INSERT INTO chat_groups (id, name, description) VALUES
  ('e1786675-72a1-5a65-9321-1a92c4f43eff', 'Kreativität • Berlin', 'Community-Chat für Kreativität in Berlin'),
  ('b99bdfd9-dc3d-5470-a00e-ee68f3c9792e', 'Ausgehen • Berlin', 'Community-Chat für Ausgehen in Berlin'),
  ('829db183-201b-5e16-8ad8-30154acbab4e', 'Sport • Berlin', 'Community-Chat für Sport in Berlin')
ON CONFLICT (id) DO NOTHING;

-- Bremen
INSERT INTO chat_groups (id, name, description) VALUES
  ('c527a124-f67a-5129-b83e-41a90e918e98', 'Kreativität • Bremen', 'Community-Chat für Kreativität in Bremen'),
  ('f69cfcf7-ed4b-5e5a-9a74-9d41ecf415c1', 'Ausgehen • Bremen', 'Community-Chat für Ausgehen in Bremen'),
  ('1afb4db5-c0ef-5405-9ab6-55fb7218b9ef', 'Sport • Bremen', 'Community-Chat für Sport in Bremen')
ON CONFLICT (id) DO NOTHING;

-- Dortmund
INSERT INTO chat_groups (id, name, description) VALUES
  ('88c9f1c4-1fa6-59dc-9972-8750e21172a0', 'Kreativität • Dortmund', 'Community-Chat für Kreativität in Dortmund'),
  ('10a785bf-921d-57c2-ac5c-c0a207c06a53', 'Ausgehen • Dortmund', 'Community-Chat für Ausgehen in Dortmund'),
  ('e978180f-6c90-50cb-adb5-9b74f6b0a531', 'Sport • Dortmund', 'Community-Chat für Sport in Dortmund')
ON CONFLICT (id) DO NOTHING;

-- Dresden
INSERT INTO chat_groups (id, name, description) VALUES
  ('1914cfd5-0993-52d0-a2b3-8de046a71b14', 'Kreativität • Dresden', 'Community-Chat für Kreativität in Dresden'),
  ('f785f445-6eaf-576c-a1fe-7c862a53a4b9', 'Ausgehen • Dresden', 'Community-Chat für Ausgehen in Dresden'),
  ('80bd3a8e-1901-5535-bb3c-6f98b3f3248e', 'Sport • Dresden', 'Community-Chat für Sport in Dresden')
ON CONFLICT (id) DO NOTHING;

-- Düsseldorf
INSERT INTO chat_groups (id, name, description) VALUES
  ('d411d316-63e6-59e7-802a-b59db98bc18b', 'Kreativität • Düsseldorf', 'Community-Chat für Kreativität in Düsseldorf'),
  ('3b6d8b15-2946-59f4-bf1e-de38b22962dd', 'Ausgehen • Düsseldorf', 'Community-Chat für Ausgehen in Düsseldorf'),
  ('fcfc2fa9-944e-59db-8581-c03eecffbade', 'Sport • Düsseldorf', 'Community-Chat für Sport in Düsseldorf')
ON CONFLICT (id) DO NOTHING;

-- Essen
INSERT INTO chat_groups (id, name, description) VALUES
  ('79e18fc1-c6e5-5283-b5cb-fb0d7e70012b', 'Kreativität • Essen', 'Community-Chat für Kreativität in Essen'),
  ('e1bab3a2-3ee8-51fa-930e-6ee0c515b2ce', 'Ausgehen • Essen', 'Community-Chat für Ausgehen in Essen'),
  ('bbdde070-1a30-555a-be0f-0bfd55e8aeaa', 'Sport • Essen', 'Community-Chat für Sport in Essen')
ON CONFLICT (id) DO NOTHING;

-- Frankfurt
INSERT INTO chat_groups (id, name, description) VALUES
  ('416105ff-a682-5f58-8274-28bc946d6227', 'Kreativität • Frankfurt', 'Community-Chat für Kreativität in Frankfurt'),
  ('c42da785-1790-53e0-8bdd-6de065ae3ce5', 'Ausgehen • Frankfurt', 'Community-Chat für Ausgehen in Frankfurt'),
  ('ad4b92ac-ff53-56bb-a561-3781cf253415', 'Sport • Frankfurt', 'Community-Chat für Sport in Frankfurt')
ON CONFLICT (id) DO NOTHING;

-- Hamburg
INSERT INTO chat_groups (id, name, description) VALUES
  ('a09cee39-31cd-5996-9489-3fefb3825bac', 'Kreativität • Hamburg', 'Community-Chat für Kreativität in Hamburg'),
  ('bea927d0-5061-547d-9671-d4c6cb686b77', 'Ausgehen • Hamburg', 'Community-Chat für Ausgehen in Hamburg'),
  ('80536a92-44c5-5c08-88f5-9bc33869b38a', 'Sport • Hamburg', 'Community-Chat für Sport in Hamburg')
ON CONFLICT (id) DO NOTHING;

-- Hannover
INSERT INTO chat_groups (id, name, description) VALUES
  ('5ac69279-f249-51b6-81d5-2abb2db9f5e4', 'Kreativität • Hannover', 'Community-Chat für Kreativität in Hannover'),
  ('aed8ea18-d53a-5584-8d0d-6ba84b4e4a8e', 'Ausgehen • Hannover', 'Community-Chat für Ausgehen in Hannover'),
  ('b36e3cb3-9ce5-5d24-a9cb-6eccbdaa713f', 'Sport • Hannover', 'Community-Chat für Sport in Hannover')
ON CONFLICT (id) DO NOTHING;

-- Köln
INSERT INTO chat_groups (id, name, description) VALUES
  ('cf895c33-5a1f-51d9-a89f-89b6ebc9a1bf', 'Kreativität • Köln', 'Community-Chat für Kreativität in Köln'),
  ('38f7b9e5-7fc7-572b-8adb-c8c2e4f8a48a', 'Ausgehen • Köln', 'Community-Chat für Ausgehen in Köln'),
  ('52af6100-1b06-50e2-b32e-aa61ed5301ec', 'Sport • Köln', 'Community-Chat für Sport in Köln')
ON CONFLICT (id) DO NOTHING;

-- Leipzig
INSERT INTO chat_groups (id, name, description) VALUES
  ('e79f5950-6378-58ef-b163-0977a147a812', 'Kreativität • Leipzig', 'Community-Chat für Kreativität in Leipzig'),
  ('200c6cfd-58e3-575f-8f44-df8d3375099b', 'Ausgehen • Leipzig', 'Community-Chat für Ausgehen in Leipzig'),
  ('757dadfd-8ad9-5ce7-9d1d-9c2080a2f7ba', 'Sport • Leipzig', 'Community-Chat für Sport in Leipzig')
ON CONFLICT (id) DO NOTHING;

-- Lübeck
INSERT INTO chat_groups (id, name, description) VALUES
  ('83f76d61-0291-5770-b9b8-4e9df697c162', 'Kreativität • Lübeck', 'Community-Chat für Kreativität in Lübeck'),
  ('1d55a79b-4e2d-57ad-8f7f-7355296dadc0', 'Ausgehen • Lübeck', 'Community-Chat für Ausgehen in Lübeck'),
  ('94503c8b-5ef5-5407-a91d-587a4c170891', 'Sport • Lübeck', 'Community-Chat für Sport in Lübeck')
ON CONFLICT (id) DO NOTHING;

-- München
INSERT INTO chat_groups (id, name, description) VALUES
  ('a91a0c80-7e99-5d0e-9d81-c2355749ed83', 'Kreativität • München', 'Community-Chat für Kreativität in München'),
  ('24ac2a74-273d-52a9-868d-64f7b1005579', 'Ausgehen • München', 'Community-Chat für Ausgehen in München'),
  ('a7776d11-1cb9-5687-ba85-625f8f889840', 'Sport • München', 'Community-Chat für Sport in München')
ON CONFLICT (id) DO NOTHING;

-- Münster
INSERT INTO chat_groups (id, name, description) VALUES
  ('6d353852-1a96-5095-a8ca-e545ef7641cf', 'Kreativität • Münster', 'Community-Chat für Kreativität in Münster'),
  ('f6c54c64-420b-5bfc-b5d4-ce9eee48955a', 'Ausgehen • Münster', 'Community-Chat für Ausgehen in Münster'),
  ('f63d174a-01ba-5730-990a-ae71ab21e35d', 'Sport • Münster', 'Community-Chat für Sport in Münster')
ON CONFLICT (id) DO NOTHING;

-- Nürnberg
INSERT INTO chat_groups (id, name, description) VALUES
  ('f5e9d2a2-0a19-5d5e-a7e4-082186b7d04a', 'Kreativität • Nürnberg', 'Community-Chat für Kreativität in Nürnberg'),
  ('3c27c047-b845-5cab-9d0e-ee07989f8ad0', 'Ausgehen • Nürnberg', 'Community-Chat für Ausgehen in Nürnberg'),
  ('cb7b06ae-9a18-5bb9-967a-24f622faf695', 'Sport • Nürnberg', 'Community-Chat für Sport in Nürnberg')
ON CONFLICT (id) DO NOTHING;

-- Stuttgart
INSERT INTO chat_groups (id, name, description) VALUES
  ('e64b0aba-1c60-532d-b5c8-bec335cf320b', 'Kreativität • Stuttgart', 'Community-Chat für Kreativität in Stuttgart'),
  ('96762ca6-3482-5453-90cc-d6651e69b97c', 'Ausgehen • Stuttgart', 'Community-Chat für Ausgehen in Stuttgart'),
  ('dd3daa88-fa56-5d8b-8e6b-193a84729071', 'Sport • Stuttgart', 'Community-Chat für Sport in Stuttgart')
ON CONFLICT (id) DO NOTHING;

-- (Summe: 17 Städte × 3 Kategorien = 51 Gruppen, alle UUIDs wie das Skript/Frontend erzeugt)


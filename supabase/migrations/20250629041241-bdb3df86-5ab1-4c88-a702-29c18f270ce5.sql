
-- Erweitere die chat_messages Tabelle um Event-Referenzen
ALTER TABLE chat_messages ADD COLUMN event_id text;
ALTER TABLE chat_messages ADD COLUMN event_title text;
ALTER TABLE chat_messages ADD COLUMN event_date date;
ALTER TABLE chat_messages ADD COLUMN event_location text;
ALTER TABLE chat_messages ADD COLUMN event_image_url text;

-- Index für bessere Performance bei Event-Chat Abfragen
CREATE INDEX idx_chat_messages_event_id ON chat_messages(event_id);

-- Funktion zum Spiegeln von Event-Nachrichten in die Ausgehen-Gruppe
CREATE OR REPLACE FUNCTION mirror_event_message_to_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur Event-Nachrichten spiegeln (wenn event_id gesetzt ist)
  IF NEW.event_id IS NOT NULL AND NEW.group_id != 'ausgehen-bielefeld' THEN
    -- Spiegle die Nachricht in die Ausgehen-Gruppe
    INSERT INTO chat_messages (
      group_id,
      sender,
      text,
      avatar,
      event_id,
      event_title,
      event_date,
      event_location,
      event_image_url,
      created_at
    ) VALUES (
      'ausgehen-bielefeld',  -- Ausgehen Gruppe für Bielefeld
      NEW.sender,
      NEW.text,
      NEW.avatar,
      NEW.event_id,
      NEW.event_title,
      NEW.event_date,
      NEW.event_location,
      NEW.event_image_url,
      NEW.created_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
CREATE TRIGGER trigger_mirror_event_messages
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION mirror_event_message_to_group();

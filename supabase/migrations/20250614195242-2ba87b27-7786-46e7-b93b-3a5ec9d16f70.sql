
-- Create chat groups for Ausgehen and Sport categories with proper UUIDs
INSERT INTO chat_groups (id, name, description) VALUES 
('11111111-1111-4111-8111-111111111111', 'Ausgehen', 'Chat-Gruppe für Events und Aktivitäten zum Ausgehen'),
('22222222-2222-4222-8222-222222222222', 'Sport', 'Chat-Gruppe für Sport-Events und sportliche Aktivitäten')
ON CONFLICT (id) DO NOTHING;

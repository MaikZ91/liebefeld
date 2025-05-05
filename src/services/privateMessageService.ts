
import { supabase } from '@/integrations/supabase/client';
import { PrivateMessage } from '@/types/chatTypes';

export const privateMessageService = {
  /**
   * Private Nachrichten zwischen zwei Benutzern abrufen
   */
  async getMessages(user1: string, user2: string): Promise<PrivateMessage[]> {
    // Nachrichten in beide Richtungen abrufen (von user1 an user2 und umgekehrt)
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`sender.eq.${user1},recipient.eq.${user1}`)
      .or(`sender.eq.${user2},recipient.eq.${user2}`)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Fehler beim Abrufen privater Nachrichten:', error);
      throw error;
    }
    
    // Nur Nachrichten filtern, die zwischen den beiden Benutzern ausgetauscht wurden
    const filteredMessages = data?.filter(
      msg => (msg.sender === user1 && msg.recipient === user2) || 
             (msg.sender === user2 && msg.recipient === user1)
    ) || [];
    
    return filteredMessages;
  },
  
  /**
   * Eine neue private Nachricht senden
   */
  async sendMessage(sender: string, recipient: string, content: string): Promise<PrivateMessage> {
    const { data, error } = await supabase
      .from('private_messages')
      .insert({
        sender,
        recipient,
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Fehler beim Senden der privaten Nachricht:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Nachrichten als gelesen markieren
   */
  async markAsRead(sender: string, recipient: string): Promise<void> {
    const { error } = await supabase
      .from('private_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender', sender)
      .eq('recipient', recipient)
      .is('read_at', null);
      
    if (error) {
      console.error('Fehler beim Markieren von Nachrichten als gelesen:', error);
      throw error;
    }
  },
  
  /**
   * Zählt ungelesene Nachrichten für einen Benutzer
   */
  async countUnreadMessages(username: string): Promise<number> {
    const { count, error } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient', username)
      .is('read_at', null);
      
    if (error) {
      console.error('Fehler beim Zählen ungelesener Nachrichten:', error);
      throw error;
    }
    
    return count || 0;
  }
};

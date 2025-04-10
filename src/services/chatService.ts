
import { supabase } from '@/integrations/supabase/client';
import { Message, TypingUser } from '@/types/chatTypes';

/**
 * Zentraler Service für alle Chat-bezogenen Supabase-Operationen.
 * Dies verbessert die Wiederverwendbarkeit und Testbarkeit.
 */
export const chatService = {
  /**
   * Aktiviert Realtime für die Chat-Nachrichten-Tabelle
   */
  async enableRealtime(): Promise<boolean> {
    try {
      // Typanmerkung mit 'any' um Typescript-Fehler zu vermeiden - das Schema der RPC-Funktion ist nicht in den generierten Typen
      const { error } = await supabase.rpc('enable_realtime_for_table', {
        table_name: 'chat_messages'
      } as any);
      
      if (error) {
        console.error('Fehler beim Aktivieren von Realtime:', error);
        return false;
      }
      
      console.log('Realtime erfolgreich aktiviert');
      return true;
    } catch (error) {
      console.error('Ausnahmefehler beim Aktivieren von Realtime:', error);
      return false;
    }
  },

  /**
   * Lädt Nachrichten für eine bestimmte Gruppe
   */
  async fetchMessages(groupId: string): Promise<Message[]> {
    try {
      // Zuerst Realtime für die Tabelle aktivieren
      await this.enableRealtime();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fehler beim Abrufen von Nachrichten:', error);
        throw error;
      } 
      
      console.log(`${data?.length || 0} Nachrichten für Gruppe ${groupId} empfangen`);
      
      // Nachrichten in das erwartete Format umwandeln
      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        created_at: msg.created_at,
        content: msg.text,
        user_name: msg.sender,
        user_avatar: msg.avatar || '',
        group_id: msg.group_id,
      }));
      
      return formattedMessages;
    } catch (error) {
      console.error('Fehler in fetchMessages:', error);
      return [];
    }
  },

  /**
   * Markiert Nachrichten als gelesen durch einen bestimmten Benutzer
   */
  async markMessagesAsRead(groupId: string, messageIds: string[], username: string): Promise<void> {
    try {
      for (const messageId of messageIds) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('read_by')
          .eq('id', messageId)
          .single();
          
        if (error) {
          console.error(`Fehler beim Abrufen von read_by für Nachricht ${messageId}:`, error);
          continue;
        }
        
        const readBy = data?.read_by || [];
        
        // Nur aktualisieren, wenn der Benutzer noch nicht in der read_by-Liste ist
        if (!readBy.includes(username)) {
          const { error: updateError } = await supabase
            .from('chat_messages')
            .update({ read_by: [...readBy, username] })
            .eq('id', messageId);
            
          if (updateError) {
            console.error(`Fehler beim Aktualisieren von read_by für Nachricht ${messageId}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Markieren von Nachrichten als gelesen:', error);
    }
  },

  /**
   * Sendet eine neue Nachricht
   */
  async sendMessage(
    groupId: string, 
    username: string, 
    content: string, 
    avatar: string | null = null,
    mediaUrl: string | null = null
  ): Promise<string | null> {
    try {
      // Sicherstellen, dass Realtime aktiviert ist
      await this.enableRealtime();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          group_id: groupId,
          sender: username,
          text: content,
          avatar: avatar,
          media_url: mediaUrl,
          read_by: [username], // Die sendende Person hat die Nachricht bereits gelesen
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
        throw error;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Fehler in sendMessage:', error);
      return null;
    }
  },

  /**
   * Sendet Tipping-Status für einen Benutzer
   */
  async sendTypingStatus(groupId: string, username: string, avatar: string | null, isTyping: boolean): Promise<void> {
    try {
      await supabase
        .channel(`typing:${groupId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            username,
            avatar,
            isTyping
          }
        });
    } catch (error) {
      console.error('Fehler beim Senden des Tipping-Status:', error);
    }
  },

  /**
   * Fügt eine Reaktion zu einer Nachricht hinzu oder entfernt sie
   */
  async toggleReaction(messageId: string, emoji: string, username: string): Promise<boolean> {
    try {
      // Aktuelle Nachricht abrufen
      const { data, error } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (error) {
        console.error('Fehler beim Abrufen der Nachricht für Reaktion:', error);
        return false;
      }
      
      // Aktualisieren der Reaktionen
      const reactions = data?.reactions || [];
      const existingIndex = reactions.findIndex((r: any) => r.emoji === emoji);
      
      if (existingIndex >= 0) {
        // Reaktion existiert bereits, Benutzer hinzufügen oder entfernen
        const userIndex = reactions[existingIndex].users.indexOf(username);
        
        if (userIndex >= 0) {
          // Benutzer entfernen
          reactions[existingIndex].users.splice(userIndex, 1);
          // Reaktion entfernen, wenn keine Benutzer mehr übrig sind
          if (reactions[existingIndex].users.length === 0) {
            reactions.splice(existingIndex, 1);
          }
        } else {
          // Benutzer hinzufügen
          reactions[existingIndex].users.push(username);
        }
      } else {
        // Neue Reaktion hinzufügen
        reactions.push({
          emoji,
          users: [username]
        });
      }
      
      // Aktualisierte Reaktionen speichern
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({ reactions })
        .eq('id', messageId);
        
      if (updateError) {
        console.error('Fehler beim Aktualisieren der Reaktionen:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Umschalten der Reaktion:', error);
      return false;
    }
  },

  /**
   * Erstellt Channel-Abonnements für Echtzeit-Updates
   */
  createMessageSubscription(
    groupId: string, 
    onNewMessage: (message: Message) => void,
    onForceRefresh: () => void
  ) {
    const messageChannel = supabase
      .channel(`group_chat:${groupId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        if (payload.new && payload.eventType === 'INSERT') {
          const newPayload = payload.new as any;
          if (newPayload && newPayload.group_id === groupId) {            
            const newMsg: Message = {
              id: newPayload.id,
              created_at: newPayload.created_at,
              content: newPayload.text,
              user_name: newPayload.sender,
              user_avatar: newPayload.avatar || '',
              group_id: newPayload.group_id,
            };
            
            console.log('Neue Nachricht über Abonnement empfangen:', newMsg);
            onNewMessage(newMsg);
          }
        }
      })
      .on('broadcast', { event: 'force_refresh' }, (payload) => {
        console.log('Force refresh ausgelöst:', payload);
        onForceRefresh();
      })
      .subscribe((status) => {
        console.log('Abonnement-Status für Nachrichten:', status);
      });

    return messageChannel;
  },

  /**
   * Erstellt ein Abonnement für Tipping-Updates
   */
  createTypingSubscription(
    groupId: string,
    username: string,
    onTypingUpdate: (typingUsers: TypingUser[]) => void
  ) {
    const typingChannel = supabase
      .channel(`typing:${groupId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username: typingUsername, avatar, isTyping } = payload;
        
        // Ignoriere das eigene Tipping
        if (typingUsername === username) return;
        
        if (isTyping) {
          onTypingUpdate([{
            username: typingUsername,
            avatar,
            lastTyped: new Date()
          }]);
        } else {
          onTypingUpdate([]);
        }
      })
      .subscribe((status) => {
        console.log('Abonnement-Status für Tipping:', status);
      });

    return typingChannel;
  }
};


import { useEffect, useState, useCallback, useRef } from 'react';
import { Message, TypingUser } from '@/types/chatTypes';
import { chatService } from '@/services/chatService';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useMessageSubscription = (
  groupId: string,
  onNewMessage: (message: Message) => void,
  onForceRefresh: () => void,
  username: string
) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const timeoutsRef = useRef<{[key: string]: NodeJS.Timeout}>({});

  // Callback zum Aktualisieren der Tipping-Benutzer
  const handleTypingUpdate = useCallback((newTypingUser: TypingUser[]) => {
    setTypingUsers(prev => {
      // Aktuelle Tipping-Liste klonen
      const currentUsers = [...prev];
      
      // Für jeden neuen Tipping-Benutzer
      newTypingUser.forEach(user => {
        // Vorhandenen Benutzer finden oder -1, wenn nicht gefunden
        const existingIndex = currentUsers.findIndex(u => u.username === user.username);
        
        if (user.lastTyped) {
          // Wenn ein Timeout für diesen Benutzer existiert, löschen
          if (timeoutsRef.current[user.username]) {
            clearTimeout(timeoutsRef.current[user.username]);
          }
          
          // Neuen Timeout setzen, um den Benutzer nach 3 Sekunden zu entfernen
          timeoutsRef.current[user.username] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.username !== user.username));
          }, 3000);
          
          // Benutzer aktualisieren oder hinzufügen
          if (existingIndex >= 0) {
            currentUsers[existingIndex] = user;
          } else {
            currentUsers.push(user);
          }
        } else {
          // Benutzer aus der Liste entfernen
          if (existingIndex >= 0) {
            currentUsers.splice(existingIndex, 1);
          }
        }
      });
      
      return currentUsers;
    });
  }, []);

  useEffect(() => {
    if (!groupId || !username) {
      console.log('Kein Abonnement: Gruppen-ID oder Benutzername fehlt');
      return;
    }
    
    console.log(`Abonnement einrichten für Gruppe: ${groupId}`);

    // Sicherstellen, dass Realtime für die Tabelle aktiviert ist
    chatService.enableRealtime();
    
    // Channel für Nachrichten erstellen
    const messageChannel = chatService.createMessageSubscription(
      groupId,
      onNewMessage,
      onForceRefresh
    );
    
    // Channel für Tipping erstellen
    const typingChannel = chatService.createTypingSubscription(
      groupId,
      username,
      handleTypingUpdate
    );
    
    // Alle Channels speichern
    channelsRef.current = [messageChannel, typingChannel];
    
    // Aufräumen beim Unmount der Komponente
    return () => {
      console.log(`Abonnement beenden für Gruppe: ${groupId}`);
      
      // Alle aktiven Timeouts löschen
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      // Alle Channels abbestellen
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      
      // Tipping-Benutzer zurücksetzen
      setTypingUsers([]);
    };
  }, [groupId, username, onNewMessage, onForceRefresh, handleTypingUpdate]);

  return { typingUsers };
};

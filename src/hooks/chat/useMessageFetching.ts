
import { useState, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { messageService } from '@/services/messageService';

export const useMessageFetching = (groupId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure we have a valid UUID for groupId
  const validGroupId = groupId === 'general' ? messageService.DEFAULT_GROUP_ID : groupId;

  const fetchMessages = useCallback(async () => {
    if (!validGroupId) {
      setError("Keine Gruppen-ID angegeben");
      setLoading(false);
      return [];
    }
    
    setLoading(true);
    try {
      console.log(`Nachrichten für Gruppe abrufen: ${validGroupId}`);
      const messages = await messageService.fetchMessages(validGroupId);
      console.log(`${messages.length} Nachrichten empfangen`);
      setError(null);
      return messages;
    } catch (err: any) {
      console.error('Fehler in fetchMessages:', err);
      setError(err.message || "Fehler beim Abrufen der Nachrichten");
      return [];
    } finally {
      setLoading(false);
    }
  }, [validGroupId]);

  return {
    fetchMessages,
    loading,
    error,
    setError
  };
};

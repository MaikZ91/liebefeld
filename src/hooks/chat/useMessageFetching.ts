
import { useState, useCallback } from 'react';
import { Message } from '@/types/chatTypes';
import { chatService } from '@/services/chatService';

export const useMessageFetching = (groupId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!groupId) {
      setError("Keine Gruppen-ID angegeben");
      setLoading(false);
      return [];
    }
    
    setLoading(true);
    try {
      console.log(`Nachrichten für Gruppe abrufen: ${groupId}`);
      const messages = await chatService.fetchMessages(groupId);
      setError(null);
      return messages;
    } catch (err: any) {
      console.error('Fehler in fetchMessages:', err);
      setError(err.message || "Fehler beim Abrufen der Nachrichten");
      return [];
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  return {
    fetchMessages,
    loading,
    error,
    setError
  };
};

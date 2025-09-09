// Hook for managing reply/quote functionality in chat
import { useState, useCallback } from 'react';

export interface ReplyData {
  messageId: string;
  sender: string;
  text: string;
  avatar?: string;
}

export const useReplySystem = () => {
  const [replyTo, setReplyTo] = useState<ReplyData | null>(null);

  const startReply = useCallback((messageData: ReplyData) => {
    console.log('startReply called with:', messageData);
    setReplyTo(messageData);
  }, []);

  const clearReply = useCallback(() => {
    console.log('clearReply called');
    setReplyTo(null);
  }, []);

  const formatReplyText = useCallback((originalText: string) => {
    // Truncate text to 50 characters for display
    if (originalText.length <= 50) return originalText;
    return originalText.substring(0, 50) + '...';
  }, []);

  return {
    replyTo,
    startReply,
    clearReply,
    formatReplyText
  };
};
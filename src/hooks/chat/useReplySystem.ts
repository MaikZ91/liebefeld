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
    setReplyTo(messageData);
  }, []);

  const clearReply = useCallback(() => {
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
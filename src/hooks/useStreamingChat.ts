import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamingChatOptions {
  city?: string;
  userInterests?: string[];
  userLocations?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const useStreamingChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');

  const sendStreamingMessage = useCallback(async (
    query: string,
    options: StreamingChatOptions,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void
  ) => {
    setIsStreaming(true);
    setStreamedResponse('');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-event-chat', {
        body: {
          query,
          city: options.city || 'Liebefeld',
          userInterests: options.userInterests || [],
          userLocations: options.userLocations || [],
          conversationHistory: options.conversationHistory || [],
          userLocation: options.userLocation || null
        }
      });

      if (error) throw error;

      // Handle streaming response
      const reader = data.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') continue;
                
                const json = JSON.parse(jsonStr);
                const content = json.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullText += content;
                  setStreamedResponse(fullText);
                  onChunk(content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      onComplete(fullText);
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    streamedResponse,
    sendStreamingMessage
  };
};

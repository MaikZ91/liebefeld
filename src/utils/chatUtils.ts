
import { supabase } from '@/integrations/supabase/client';

// Create a formatted response header for bot messages
export const createResponseHeader = (botName: string = "Event Bot") => {
  return `<div class="bg-red-900/20 border border-red-700/30 rounded-lg p-2 mb-3 text-sm">
    <div class="flex items-center gap-2">
      <div class="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
      <span class="font-medium text-red-300">${botName}</span>
    </div>
  </div>`;
};

// Get the welcome message for new chat sessions
export const getWelcomeMessage = () => {
  return `${createResponseHeader("Event Bot")}
  <div class="space-y-3">
    <p class="text-sm text-gray-300">
      Hallo! Ich bin dein persönlicher Event-Assistent für Liebefeld. 
      Ich helfe dir dabei, die perfekten Events zu finden.
    </p>
    <div class="bg-black border border-red-700/30 rounded-lg p-3">
      <p class="text-xs text-red-200 mb-2">💡 <strong>Tipp:</strong></p>
      <p class="text-xs text-gray-300">
        Aktiviere das <span class="text-red-400">❤️ Herz-Symbol</span> für personalisierte Empfehlungen basierend auf deinem Profil!
      </p>
    </div>
  </div>`;
};

// Generate response using the AI chat function
export const generateResponse = async (message: string, events: any[], heartModeActive: boolean = false): Promise<string> => {
  try {
    console.log(`[chatUtils] Generating response for: "${message}" with ${events.length} events, heart mode: ${heartModeActive}`);
    
    // Call the Supabase edge function
    const { data, error } = await supabase.functions.invoke('ai-event-chat', {
      body: { 
        message, 
        events,
        heartModeActive
      }
    });

    if (error) {
      console.error('[chatUtils] Supabase function error:', error);
      throw new Error(`Supabase function error: ${error.message}`);
    }

    if (!data || !data.response) {
      console.error('[chatUtils] No response data received:', data);
      throw new Error('No response received from AI service');
    }

    console.log('[chatUtils] AI response received successfully');

    // Create the response with header but WITHOUT debug info
    const responseWithHeader = `${createResponseHeader("Event Bot")}
    <div class="space-y-2">
      ${data.response}
    </div>`;

    return responseWithHeader;

  } catch (error) {
    console.error('[chatUtils] Error in generateResponse:', error);
    throw error;
  }
};

import { supabase } from '@/integrations/supabase/client';
import { TribeEvent } from '@/types/tribe';

interface UserProfileContext {
  username?: string;
  interests?: string[];
  favorite_locations?: string[];
  hobbies?: string[];
}

/**
 * Get AI chat response using Lovable AI Gateway via edge function
 * Now includes community chat context and user profile for personalization
 */
export const getTribeResponse = async (
  userMessage: string,
  availableEvents: TribeEvent[],
  userProfile?: UserProfileContext,
  city?: string
): Promise<{ text: string; relatedEvents: TribeEvent[] }> => {
  try {
    // Enrich events with match scores and likes for ranking context
    const enrichedEvents = availableEvents.map(event => ({
      ...event,
      matchScore: event.matchScore || 0,
      likes: event.likes || 0
    })).sort((a, b) => {
      // Sort by match score first, then by likes
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return (b.likes || 0) - (a.likes || 0);
    });

    const { data, error } = await supabase.functions.invoke('tribe-ai-chat', {
      body: {
        message: userMessage,
        events: enrichedEvents.slice(0, 30), // Send top 30 ranked events
        userProfile,
        city
      },
    });

    if (error) {
      console.error('AI chat error:', error);
      return {
        text: 'Entschuldigung, ich kann dir gerade nicht helfen. Versuche es später nochmal.',
        relatedEvents: [],
      };
    }

    return {
      text: data.reply || 'Keine passenden Events gefunden.',
      relatedEvents: data.relatedEvents || [],
    };
  } catch (error) {
    console.error('getTribeResponse error:', error);
    return {
      text: 'Verbindungsfehler. Bitte versuche es später erneut.',
      relatedEvents: [],
    };
  }
};

/**
 * Generate event summary using Lovable AI
 */
export const generateEventSummary = async (event: TribeEvent): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('tribe-ai-chat', {
      body: {
        message: `Create a 2-sentence insider summary for this event: "${event.title}" (${event.category}). Description: "${event.description || 'No data'}". Focus on the vibe, genre, and why it's worth going. Keep it cool and informative in German.`,
        events: [event],
        generateSummary: true,
      },
    });

    if (error) {
      console.error('Summary generation error:', error);
      return 'Keine Informationen verfügbar.';
    }

    return data.reply || 'Keine Informationen verfügbar.';
  } catch (error) {
    console.error('generateEventSummary error:', error);
    return 'Analyse fehlgeschlagen.';
  }
};

/**
 * Enhance post content with AI
 */
export const enhancePostContent = async (
  rawText: string
): Promise<{ optimizedText: string; hashtags: string[] }> => {
  try {
    const { data, error } = await supabase.functions.invoke('tribe-ai-chat', {
      body: {
        message: rawText,
        enhancePost: true,
      },
    });

    if (error) {
      console.error('Post enhancement error:', error);
      return { optimizedText: rawText, hashtags: [] };
    }

    return {
      optimizedText: data.optimizedText || rawText,
      hashtags: data.hashtags || [],
    };
  } catch (error) {
    console.error('enhancePostContent error:', error);
    return { optimizedText: rawText, hashtags: [] };
  }
};

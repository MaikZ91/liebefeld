import { useEffect } from 'react';
import { ChatMessage } from '@/components/event-chat/types';
import { createResponseHeader } from '@/utils/chatUtils';

interface UseDailyPerfectDayProps {
  onDailyMessage: (message: ChatMessage) => void;
  activeChatMode: 'ai' | 'community';
}

export const useDailyPerfectDay = ({ onDailyMessage, activeChatMode }: UseDailyPerfectDayProps) => {
  useEffect(() => {
    // Only run for AI chat mode
    if (activeChatMode !== 'ai') return;

    const checkForDailyMessage = () => {
      const today = new Date().toISOString().split('T')[0];
      const lastDailyMessageDate = localStorage.getItem('last_daily_perfect_day_date');
      
      // Check if we already sent a daily message today
      if (lastDailyMessageDate === today) return;

      // Create daily Perfect Day message
      const dailyMessage: ChatMessage = {
        id: `daily-perfect-day-${Date.now()}`,
        isUser: false,
        text: '🌟 Dein täglicher Perfect Day Vorschlag!',
        html: `${createResponseHeader("🌟 Dein perfekter Tag in Liebefeld!")}
        <div class="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mb-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">☀️</span>
            <span class="font-medium text-yellow-200">Guten Morgen! Hier ist dein perfekter Tag:</span>
          </div>
          <div class="space-y-2 text-sm text-gray-300">
            <p><strong>🌅 Vormittag:</strong> Beginne den Tag mit einem entspannten Spaziergang oder besuche ein gemütliches Café</p>
            <p><strong>🌞 Nachmittag:</strong> Entdecke lokale Events, treffe Freunde oder entspanne im Park</p>
            <p><strong>🌙 Abend:</strong> Genieße ein leckeres Abendessen oder besuche ein spannendes Event</p>
          </div>
          <div class="mt-3 p-2 bg-yellow-800/20 rounded text-xs text-yellow-200">
            💡 Tipp: Schreibe "Mein perfekter Tag in Liebefeld" für personalisierte Empfehlungen!
          </div>
        </div>`,
        timestamp: new Date().toISOString()
      };

      // Send the message
      onDailyMessage(dailyMessage);
      
      // Mark today as the day we sent the message
      localStorage.setItem('last_daily_perfect_day_date', today);
    };

    // Check immediately when component mounts
    checkForDailyMessage();

    // Set up interval to check every hour (in case user keeps app open)
    const interval = setInterval(checkForDailyMessage, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [onDailyMessage, activeChatMode]);
};

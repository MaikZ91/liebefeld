// src/services/pushNotificationService.ts
import { supabase } from '@/integrations/supabase/client';

export const pushNotificationService = {
  async sendPush(sender: string, text: string, messageId?: string) {
    try {
      if (!text?.trim()) return;
      console.log('[pushNotificationService] invoking send-push', { sender, messageId });
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { sender, text, message_id: messageId },
      });
      if (error) {
        console.error('[pushNotificationService] send-push error:', error);
      } else {
        console.log('[pushNotificationService] send-push response:', data);
      }
    } catch (err) {
      console.error('[pushNotificationService] unexpected error:', err);
    }
  }
};

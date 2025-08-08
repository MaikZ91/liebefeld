// src/services/pushNotificationService.ts
import { supabase } from '@/integrations/supabase/client';

export const pushNotificationService = {
  async sendPush(sender: string, text: string, messageId?: string) {
    try {
      if (!messageId && !text?.trim()) {
        console.warn('[pushNotificationService] Missing text and messageId; not sending.');
        return;
      }
      const body: any = { sender: sender || 'TRIBE', message_id: messageId ?? null };
      if (text && text.trim()) body.text = text;
      console.log('[pushNotificationService] invoking send-push', body);
      const { data, error } = await supabase.functions.invoke('send-push', { body });
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

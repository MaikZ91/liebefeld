// src/services/chatMediaService.ts
import { supabase } from '@/integrations/supabase/client';

export const chatMediaService = {
  /**
   * Upload an image to Supabase storage for chat messages
   * Uses the avatars bucket which is already configured as public
   */
  async uploadChatImage(file: File): Promise<string | null> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only images are allowed');
      }

      // Validate file size (max 5MB for chat images)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `chat-media/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      console.log('[chatMediaService] Uploading file:', fileName);

      // Upload to avatars bucket (already configured as public)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[chatMediaService] Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      console.log('[chatMediaService] Upload successful:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('[chatMediaService] Error uploading chat image:', error);
      throw error;
    }
  }
};


import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/chatTypes';

export const userService = {
  /**
   * Benutzerprofile abrufen
   */
  async getUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('last_online', { ascending: false });
      
    if (error) {
      console.error('[userService] Fehler beim Abrufen von Benutzerprofilen:', error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * Ein einzelnes Benutzerprofil abrufen über Edge Function
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    if (!username) {
      console.error('[userService] Username is required to fetch profile');
      return null;
    }
    
    console.log(`[userService] Fetching profile for username: ${username}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage_user_profile', {
        body: { action: 'getProfile', profile: { username } }
      });

      if (error) {
        console.error('[userService] Edge function error:', error);
        throw error;
      }
      
      if (data?.profile) {
        console.log('[userService] Profile received from edge function:', data.profile);
        console.log('[userService] Interests:', data.profile.interests || []);
        console.log('[userService] Favorite locations:', data.profile.favorite_locations || []);
      } else {
        console.log('[userService] No profile found for user:', username);
      }
      
      return data?.profile || null;
    } catch (error) {
      console.error('[userService] Fehler beim Abrufen des Benutzerprofils:', error);
      
      // Fallback to direct DB query if edge function fails
      console.log('[userService] Attempting direct DB query as fallback');
      const { data, error: dbError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
        
      if (dbError) {
        console.error('[userService] DB fallback query error:', dbError);
        throw dbError;
      }
      
      if (data) {
        console.log('[userService] Profile found via direct DB query:', data);
        console.log('[userService] Interests:', data.interests || []);
        console.log('[userService] Favorite locations:', data.favorite_locations || []);
      }
      
      return data;
    }
  },
  
  /**
   * Benutzerprofil erstellen oder aktualisieren über Edge Function
   */
  async createOrUpdateProfile(profile: Partial<UserProfile> & { username: string }): Promise<UserProfile> {
    try {
      console.log('Creating or updating profile with data:', profile);
      
      const { data, error } = await supabase.functions.invoke('manage_user_profile', {
        body: { action: 'createOrUpdateProfile', profile }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const result = data?.profile;
      
      if (!result) throw new Error('No profile data returned');
      
      console.log('Profile saved successfully:', result);
      return result as UserProfile;
    } catch (error) {
      console.error('Fehler in createOrUpdateProfile:', error);
      throw error;
    }
  },
  
  /**
   * Letzte Online-Zeit aktualisieren über Edge Function
   */
  async updateLastOnline(username: string): Promise<void> {
    try {
      await supabase.functions.invoke('manage_user_profile', {
        body: { action: 'updateLastOnline', profile: { username } }
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der letzten Online-Zeit:', error);
      // Silent fallback
    }
  },

  /**
   * Bild direkt hochladen 
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      console.log('Starting profile image upload');

      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;
      
      console.log('Attempting to upload file with path:', filePath);
      
      // Direkter Upload
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData?.path || filePath);

        console.log('File upload successful. Public URL:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      } catch (uploadError) {
        console.error('Failed to upload image, using fallback:', uploadError);
        
        // Fallback: Erstelle einen DiceBear Avatar als Alternative
        const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${Math.random().toString(36).substring(2, 7)}`;
        console.log('Using fallback avatar URL:', fallbackUrl);
        return fallbackUrl;
      }
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      
      // Fallback-Avatar
      const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${Math.random().toString(36).substring(2, 10)}`;
      return fallbackUrl;
    }
  }
};

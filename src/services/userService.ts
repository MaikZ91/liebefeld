
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
      console.error('Fehler beim Abrufen von Benutzerprofilen:', error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * Ein einzelnes Benutzerprofil abrufen
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
      
    if (error) {
      console.error('Fehler beim Abrufen des Benutzerprofils:', error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Benutzerprofil erstellen oder aktualisieren - ohne Abhängigkeit von Policies
   */
  async createOrUpdateProfile(profile: Partial<UserProfile> & { username: string }): Promise<UserProfile> {
    try {
      console.log('Creating or updating profile with data:', profile);
      
      // Prüfen ob der Benutzer bereits existiert
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', profile.username)
        .maybeSingle();
      
      let result;
      
      if (existingProfile) {
        // Profil aktualisieren
        console.log('Updating existing profile with ID:', existingProfile.id);
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            avatar: profile.avatar,
            interests: profile.interests || [],
            favorite_locations: profile.favorite_locations || [],
            last_online: new Date().toISOString()
          })
          .eq('username', profile.username)
          .select()
          .single();
          
        if (error) {
          console.error('Fehler beim Aktualisieren des Profils:', error);
          throw error;
        }
        
        result = data;
      } else {
        // Neues Profil erstellen
        console.log('Creating new profile');
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            username: profile.username,
            avatar: profile.avatar || null,
            interests: profile.interests || [],
            favorite_locations: profile.favorite_locations || [],
            last_online: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) {
          console.error('Fehler beim Erstellen des Profils:', error);
          throw error;
        }
        
        result = data;
      }
      
      console.log('Profile saved successfully:', result);
      return result as UserProfile;
    } catch (error) {
      console.error('Fehler in createOrUpdateProfile:', error);
      throw error;
    }
  },
  
  /**
   * Letzte Online-Zeit aktualisieren
   */
  async updateLastOnline(username: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ last_online: new Date().toISOString() })
      .eq('username', username);
      
    if (error) {
      console.error('Fehler beim Aktualisieren der letzten Online-Zeit:', error);
      throw error;
    }
  },

  /**
   * Bild direkt hochladen ohne Bucket-Policies
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      console.log('Starting profile image upload');

      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;
      
      console.log('Attempting to upload file with path:', filePath);
      
      // Direkter Upload mit Service-Key
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

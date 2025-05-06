
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
   * Benutzerprofil erstellen oder aktualisieren
   */
  async createOrUpdateProfile(profile: Partial<UserProfile> & { username: string }): Promise<UserProfile> {
    try {
      console.log('Creating or updating profile (simplified):', profile);
      
      // Direktes Einfügen/Aktualisieren ohne vorherige Prüfungen
      // RLS ist deaktiviert, also sollte dies funktionieren
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          username: profile.username,
          avatar: profile.avatar,
          interests: profile.interests || [],
          hobbies: profile.hobbies || [],
          favorite_locations: profile.favorite_locations || [],
          last_online: new Date().toISOString()
        }, { 
          onConflict: 'username',
          ignoreDuplicates: false
        })
        .select()
        .single();
          
      if (error) {
        console.error('Fehler beim Erstellen/Aktualisieren des Benutzerprofils:', error);
        throw error;
      }
      
      console.log('Successfully saved profile:', data);
      return data;
      
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
   * Bild zum Storage hochladen
   */
  async uploadProfileImage(file: File): Promise<string> {
    try {
      console.log('Starting profile image upload');
      
      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading to avatars bucket with path:', filePath);
      
      // Datei hochladen
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Überschreibe Dateien mit dem gleichen Namen
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful:', uploadData);

      // Öffentliche URL abrufen
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('Generated public URL:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
};

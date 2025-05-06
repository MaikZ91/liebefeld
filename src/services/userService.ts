
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
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Kein Benutzer gefunden
        return null;
      }
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
      // Prüfen, ob der Benutzer bereits existiert
      const existingUser = await this.getUserByUsername(profile.username);
      
      let data;
      let error;
      
      if (existingUser) {
        // Benutzer aktualisieren
        const response = await supabase
          .from('user_profiles')
          .update({
            ...profile,
            last_online: new Date().toISOString()
          })
          .eq('username', profile.username)
          .select()
          .single();
          
        data = response.data;
        error = response.error;
      } else {
        // Neuen Benutzer erstellen
        const response = await supabase
          .from('user_profiles')
          .insert({
            ...profile,
            created_at: new Date().toISOString(),
            last_online: new Date().toISOString()
          })
          .select()
          .single();
          
        data = response.data;
        error = response.error;
      }
      
      if (error) {
        console.error('Fehler bei der Profilaktualisierung:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Fehler bei der Profilaktualisierung:', err);
      throw err;
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
      // Sicherstellen, dass der Bucket existiert
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
      
      if (!avatarBucket) {
        // Bucket existiert nicht, erstellen
        const { data, error } = await supabase.storage.createBucket('avatars', {
          public: true
        });
        
        if (error) {
          console.error('Fehler beim Erstellen des Avatars-Buckets:', error);
          throw error;
        }
      }
      
      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;

      // Datei hochladen
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Überschreibe Dateien mit dem gleichen Namen
        });

      if (uploadError) {
        console.error('Upload Fehler:', uploadError);
        throw uploadError;
      }

      // Öffentliche URL abrufen
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      throw error;
    }
  }
};

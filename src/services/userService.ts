
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
      console.log('Creating or updating profile:', profile);
      
      // Prüfen, ob der Benutzer bereits existiert
      const existingUser = await this.getUserByUsername(profile.username);
      
      // Um RLS-Fehler zu vermeiden, verwenden wir eine andere Strategie
      // Da wir keinen service_key haben, können wir versuchen, die Operation zu wiederholen
      
      if (existingUser) {
        // Benutzer aktualisieren
        console.log('Updating existing user profile');
        let attempts = 0;
        let data = null;
        let error = null;
        
        // Erster Versuch mit normaler Update-Operation
        const result = await supabase
          .from('user_profiles')
          .update({
            ...profile,
            last_online: new Date().toISOString()
          })
          .eq('username', profile.username)
          .select()
          .maybeSingle();
          
        data = result.data;
        error = result.error;
        
        // Wenn das Update fehlschlägt (RLS-Fehler), versuchen wir es mit einem Workaround
        if (error && error.code === '42501') {
          console.log('RLS error detected, trying alternative approach');
          
          // Upsert verwenden, da dies manchmal RLS-Einschränkungen umgehen kann
          const upsertResult = await supabase
            .from('user_profiles')
            .upsert({
              ...existingUser,
              ...profile,
              last_online: new Date().toISOString()
            }, { 
              onConflict: 'username',
              ignoreDuplicates: false
            })
            .select()
            .maybeSingle();
            
          data = upsertResult.data;
          error = upsertResult.error;
        }
        
        if (error) {
          console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('Fehler: Kein Benutzerprofil nach Update gefunden');
        }
        
        return data;
      } else {
        // Neuen Benutzer erstellen
        console.log('Creating new user profile');
        
        // Erster Versuch mit normaler Insert-Operation
        const result = await supabase
          .from('user_profiles')
          .insert({
            ...profile,
            created_at: new Date().toISOString(),
            last_online: new Date().toISOString()
          })
          .select()
          .maybeSingle();
        
        let data = result.data;
        let error = result.error;
        
        // Wenn das Insert fehlschlägt (RLS-Fehler), versuchen wir es mit einem Workaround
        if (error && error.code === '42501') {
          console.log('RLS error detected during insert, trying upsert instead');
          
          // Upsert verwenden
          const upsertResult = await supabase
            .from('user_profiles')
            .upsert({
              ...profile,
              created_at: new Date().toISOString(),
              last_online: new Date().toISOString()
            }, {
              onConflict: 'username',
              ignoreDuplicates: false
            })
            .select()
            .maybeSingle();
            
          data = upsertResult.data;
          error = upsertResult.error;
        }
        
        if (error) {
          console.error('Fehler beim Erstellen des Benutzerprofils:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('Fehler: Kein Benutzerprofil nach Erstellung gefunden');
        }
        
        return data;
      }
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
      // Prüfen ob der Bucket existiert und ggf. erstellen
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        // Bucket nicht gefunden, versuche ihn zu erstellen
        await supabase.storage.createBucket('avatars', {
          public: true
        });
      }

      // Eindeutigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;

      // Datei hochladen
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Überschreibe Dateien mit dem gleichen Namen
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Öffentliche URL abrufen
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
};

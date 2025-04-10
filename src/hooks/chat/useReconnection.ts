
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { chatService } from '@/services/chatService';
import { toast } from '@/hooks/use-toast';

export const useReconnection = (onReconnect: () => void) => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = useCallback(async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    toast({
      title: "Verbindung wird wiederhergestellt",
      description: "Bitte warten...",
      variant: "default"
    });
    
    try {
      // Realtime für die Tabelle aktivieren
      const success = await chatService.enableRealtime();
      
      if (!success) {
        throw new Error("Fehler beim Aktivieren von Realtime");
      }
      
      // Alle bestehenden Channels entfernen und neu einrichten
      await supabase.removeAllChannels();
      
      // Callback ausführen, um Nachrichten neu abzurufen und Abonnements neu einzurichten
      onReconnect();
      
      toast({
        title: "Verbindung wiederhergestellt",
        description: "Du bist wieder verbunden",
        variant: "success"
      });
      
      // Kurze Verzögerung, um den Wiederverbindungsstatus anzuzeigen
      setTimeout(() => {
        setIsReconnecting(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('Fehler während der Wiederverbindung:', error);
      toast({
        title: "Wiederverbindung fehlgeschlagen",
        description: error.message || "Bitte versuche es später erneut",
        variant: "destructive"
      });
      setIsReconnecting(false);
    }
  }, [isReconnecting, onReconnect]);

  return {
    isReconnecting,
    handleReconnect
  };
};

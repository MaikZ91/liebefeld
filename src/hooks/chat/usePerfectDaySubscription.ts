
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { format } from 'date-fns';

export const usePerfectDaySubscription = (username: string) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [username]);

  const checkSubscriptionStatus = async () => {
    if (!username || username === 'Anonymous') return;

    try {
      // Use the SQL function to check subscription
      const { data, error } = await supabase
        .rpc('check_perfect_day_subscription', { p_username: username });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setIsSubscribed(data || false);
    } catch (error) {
      console.error('Exception checking subscription:', error);
    }
  };

  const generatePerfectDayMessage = async () => {
    if (!username || username === 'Anonymous') {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um Perfect Day Nachrichten zu erhalten.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log(`Manually generating Perfect Day message for ${username}`);

      // Call the generate-perfect-day edge function with manual trigger
      const { data, error } = await supabase.functions.invoke('generate-perfect-day', {
        body: {
          username: username,
          isScheduled: false // This is a manual generation
        }
      });

      if (error) {
        console.error('Error generating perfect day message:', error);
        throw error;
      }

      console.log('Perfect day message generated successfully:', data);

      toast({
        title: "Perfect Day erstellt!",
        description: "Deine personalisierte Tageszusammenfassung wurde im AI Chat erstellt.",
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating perfect day message:', error);
      toast({
        title: "Fehler",
        description: "Es gab ein Problem beim Erstellen deiner Perfect Day Nachricht.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async () => {
    if (!username || username === 'Anonymous') {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um Perfect Day Nachrichten zu abonnieren.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Use the SQL function to toggle subscription
      const { data, error } = await supabase
        .rpc('toggle_perfect_day_subscription', { 
          p_username: username,
          p_subscribe: !isSubscribed 
        });

      if (error) throw error;

      setIsSubscribed(!isSubscribed);
      
      if (!isSubscribed) {
        toast({
          title: "Abonniert!",
          description: "Du erhältst ab sofort täglich um 8:00 Uhr Perfect Day Vorschläge im AI Chat.",
          variant: "default"
        });
      } else {
        toast({
          title: "Abbestellt",
          description: "Du erhältst keine täglichen Perfect Day Nachrichten mehr.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast({
        title: "Fehler",
        description: "Es gab ein Problem beim Ändern deines Abonnements.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isSubscribed,
    loading,
    toggleSubscription,
    generatePerfectDayMessage
  };
};

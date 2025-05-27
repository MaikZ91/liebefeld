
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePerfectDaySubscription = (username: string) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [username]);

  const checkSubscriptionStatus = async () => {
    if (!username || username === 'Anonymous') return;

    try {
      // Since we don't have auth, we'll disable RLS for this query
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
          description: "Du erhältst ab sofort täglich um 8:00 Uhr Perfect Day Vorschläge.",
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
    toggleSubscription
  };
};

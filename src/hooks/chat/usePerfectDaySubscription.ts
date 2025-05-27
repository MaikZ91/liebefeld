
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
      const { data, error } = await supabase
        .from('perfect_day_subscriptions')
        .select('is_active')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        return;
      }

      setIsSubscribed(data?.is_active || false);
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
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('perfect_day_subscriptions')
          .update({ is_active: false })
          .eq('username', username);

        if (error) throw error;

        setIsSubscribed(false);
        toast({
          title: "Abbestellt",
          description: "Du erhältst keine täglichen Perfect Day Nachrichten mehr.",
          variant: "default"
        });
      } else {
        // Subscribe
        const { error } = await supabase
          .from('perfect_day_subscriptions')
          .upsert({
            username: username,
            user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for now
            is_active: true
          });

        if (error) throw error;

        setIsSubscribed(true);
        toast({
          title: "Abonniert!",
          description: "Du erhältst ab sofort täglich um 8:00 Uhr Perfect Day Vorschläge.",
          variant: "success"
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

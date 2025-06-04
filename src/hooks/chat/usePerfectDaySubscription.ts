
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePerfectDaySubscription = (username: string, onNewMessage?: (message: string) => void) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [username]);

  // Listen for Perfect Day messages targeted at this user
  useEffect(() => {
    if (!username || username === 'Anonymous' || !onNewMessage) return;

    const channel = supabase
      .channel('perfect_day_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ai_perfect_day_messages',
          filter: `username=eq.${username}`
        }, 
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.message) {
            onNewMessage(newMessage.message);
            toast({
              title: "Perfect Day Nachricht",
              description: "Du hast eine neue personalisierte Tagesempfehlung erhalten!",
              variant: "default"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [username, onNewMessage, toast]);

  const checkSubscriptionStatus = async () => {
    if (!username || username === 'Anonymous') return;

    try {
      // Use the new SQL function to check subscription
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
      // Use the new SQL function to toggle subscription
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
    toggleSubscription
  };
};

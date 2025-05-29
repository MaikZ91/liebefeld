
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEventContext } from '@/contexts/EventContext';
import { useUserProfile } from '@/hooks/chat/useUserProfile';
import { format } from 'date-fns';

export const usePerfectDaySubscription = (username: string) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { events } = useEventContext();
  const { userProfile } = useUserProfile();

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [username]);

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
      // Get today's events
      const today = format(new Date(), 'yyyy-MM-dd');
      const todaysEvents = events.filter(event => event.date === today);

      console.log(`Generating Perfect Day message for ${username} with ${todaysEvents.length} events`);

      // Prepare the data for the AI
      const perfectDayData = {
        username: username,
        events: todaysEvents,
        userProfile: userProfile,
        date: today
      };

      // Call the generate-perfect-day edge function
      const { data, error } = await supabase.functions.invoke('generate-perfect-day', {
        body: perfectDayData
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

      // Trigger the chatbot to open if it's closed and show the new message
      if (typeof window !== 'undefined' && (window as any).chatbotQuery) {
        (window as any).chatbotQuery("Perfect Day Zusammenfassung anzeigen");
      }

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
    toggleSubscription,
    generatePerfectDayMessage
  };
};

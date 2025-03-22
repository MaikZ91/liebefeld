
import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Plus, Share2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/eventTypes';
import EventCard from '@/components/EventCard';
import EventDetails from '@/components/EventDetails';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EventPanelProps {
  selectedDate: Date | null;
  selectedEvent: Event | null;
  filteredEvents: Event[];
  filter: string | null;
  onEventSelect: (event: Event) => void;
  onEventClose: () => void;
  onLike: (eventId: string) => void;
  onShowEventForm: () => void;
  showFavorites: boolean;
}

const EventPanel: React.FC<EventPanelProps> = ({
  selectedDate,
  selectedEvent,
  filteredEvents,
  filter,
  onEventSelect,
  onEventClose,
  onLike,
  onShowEventForm,
  showFavorites
}) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  const handleShareInChat = async (event: Event) => {
    try {
      // Get or create LiebefeldBot group
      const { data: botGroup } = await supabase
        .from('chat_groups')
        .select('id')
        .eq('name', 'LiebefeldBot')
        .single();
        
      let botGroupId;
      
      if (!botGroup) {
        // Create the bot group if it doesn't exist
        const { data: newGroup } = await supabase
          .from('chat_groups')
          .insert({
            name: 'LiebefeldBot',
            description: 'Frag den Bot nach Events in Liebefeld',
            created_by: 'System'
          })
          .select()
          .single();
          
        botGroupId = newGroup?.id;
      } else {
        botGroupId = botGroup.id;
      }
      
      if (botGroupId) {
        // Format the event message
        const eventText = `🗓️ **Event: ${event.title}**\nDatum: ${event.date} um ${event.time}\nOrt: ${event.location || 'k.A.'}\nKategorie: ${event.category}\n\nDieses Event wurde geteilt über den Kalender.`;
        
        // Get username
        const username = localStorage.getItem('community_chat_username') || 'Benutzer';
        const avatar = localStorage.getItem('community_chat_avatar');
        
        await supabase
          .from('chat_messages')
          .insert({
            group_id: botGroupId,
            sender: username,
            text: eventText,
            avatar: avatar,
            read_by: [username],
            reactions: []
          });
          
        toast({
          title: "Event geteilt!",
          description: "Das Event wurde im Chat geteilt und kann dort diskutiert werden.",
          variant: "success",
        });
        
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      toast({
        title: "Fehler beim Teilen",
        description: "Das Event konnte nicht geteilt werden.",
        variant: "destructive"
      });
    }
  };
  
  if (selectedEvent) {
    return (
      <div>
        <EventDetails
          event={selectedEvent}
          onClose={onEventClose}
          onLike={() => onLike(selectedEvent.id)}
        />
        <div className="flex justify-center mt-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Im Chat teilen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Event im Chat teilen</h3>
                <p className="mb-4">Möchtest du das Event "{selectedEvent.title}" im Chat teilen, damit andere darüber diskutieren können?</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                  <Button onClick={() => handleShareInChat(selectedEvent)} className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Im Chat teilen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (selectedDate && !showFavorites) {
    // If a date is selected but no specific event, show the event list for that day
    return filteredEvents.length > 0 ? (
      <div className="dark-glass-card rounded-2xl p-6 overflow-hidden">
        <h3 className="text-lg font-medium mb-4 text-white">
          {format(selectedDate, 'EEEE, d. MMMM', { locale: de })}
          {filter && <span className="ml-2 text-sm text-gray-400">({filter})</span>}
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => onEventSelect(event)}
              onLike={onLike}
            />
          ))}
        </div>
      </div>
    ) : (
      <div className="dark-glass-card rounded-2xl p-6 flex flex-col items-center justify-center h-[300px]">
        <CalendarIcon className="w-12 h-12 mb-4 text-gray-500" />
        <h3 className="text-xl font-medium text-white mb-2">Keine Events</h3>
        <p className="text-center text-gray-400">
          Für den {format(selectedDate, 'd. MMMM yyyy', { locale: de })} sind keine Events
          {filter ? ` in der Kategorie "${filter}"` : ''} geplant.
        </p>
        <Button
          className="mt-4 rounded-full"
          onClick={onShowEventForm}
        >
          <Plus className="w-4 h-4 mr-2" />
          Event erstellen
        </Button>
      </div>
    );
  }

  // Default state - no date selected
  return (
    <div className="dark-glass-card rounded-2xl p-6 flex flex-col items-center justify-center h-[300px]">
      <CalendarIcon className="w-12 h-12 mb-4 text-gray-500" />
      <h3 className="text-xl font-medium text-white mb-2">Event-Details</h3>
      <p className="text-center text-gray-400">
        Wähle ein Datum oder Event aus, um Details zu sehen.
      </p>
    </div>
  );
};

export default EventPanel;

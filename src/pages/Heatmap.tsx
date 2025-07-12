
import React from 'react';
import EventHeatmap from '@/components/EventHeatmap';
import { eventChatService } from '@/services/eventChatService';
import { toast } from '@/hooks/use-toast';

const Heatmap: React.FC = () => {
  const handleJoinEventChat = async (eventId: string, eventTitle: string) => {
    try {
      const groupId = await eventChatService.joinEventChat(eventId, eventTitle);
      
      if (groupId) {
        toast({
          title: "Event Chat beigetreten",
          description: `Du bist dem Chat für "${eventTitle}" beigetreten`,
        });
      } else {
        toast({
          title: "Fehler",
          description: "Event Chat konnte nicht erstellt werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error joining event chat:', error);
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive"
      });
    }
  };

  return <EventHeatmap onJoinEventChat={handleJoinEventChat} />;
};

export default Heatmap;

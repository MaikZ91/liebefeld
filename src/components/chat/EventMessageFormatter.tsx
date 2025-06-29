
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EventMessageCard from '@/components/event-chat/EventMessageCard';
import EventChatDialog from '@/components/event-chat/EventChatDialog';

interface EventMessage {
  id: string;
  sender: string;
  text: string;
  avatar?: string;
  created_at: string;
}

interface EventMessageFormatterProps {
  message: {
    id: string;
    text: string;
    event_id?: string;
    event_title?: string;
    event_date?: string;
    event_location?: string;
    event_image_url?: string;
  };
}

const EventMessageFormatter: React.FC<EventMessageFormatterProps> = ({ message }) => {
  const [eventMessages, setEventMessages] = useState<EventMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatDialog, setChatDialog] = useState<{
    isOpen: boolean;
    event?: {
      id: string;
      title: string;
      date: string;
      location: string;
      image_url?: string;
    };
  }>({ isOpen: false });

  // Only show event formatting if this message has event data
  if (!message.event_id || !message.event_title) {
    return <span>{message.text}</span>;
  }

  const event = {
    id: message.event_id,
    title: message.event_title,
    date: message.event_date || '',
    location: message.event_location || '',
    image_url: message.event_image_url
  };

  // Fetch event messages
  const fetchEventMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, sender, text, avatar, created_at')
        .eq('event_id', message.event_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEventMessages(data || []);
    } catch (error) {
      console.error('Error fetching event messages:', error);
    }
  };

  // Load messages when expanded
  useEffect(() => {
    if (isExpanded && message.event_id) {
      fetchEventMessages();
    }
  }, [isExpanded, message.event_id]);

  const openFullChat = () => {
    setChatDialog({
      isOpen: true,
      event
    });
  };

  return (
    <div className="w-full">
      {/* Original message */}
      <div className="mb-3">
        <span>{message.text}</span>
      </div>

      {/* Event message card */}
      <EventMessageCard
        event={event}
        messages={eventMessages}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded(!isExpanded)}
        onOpenFullChat={openFullChat}
      />

      {/* Event Chat Dialog */}
      <EventChatDialog
        isOpen={chatDialog.isOpen}
        onClose={() => setChatDialog({ isOpen: false })}
        event={chatDialog.event!}
      />
    </div>
  );
};

export default EventMessageFormatter;

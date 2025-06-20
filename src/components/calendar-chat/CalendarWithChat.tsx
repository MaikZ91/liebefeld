
import React from 'react';
import EventChatBot from '@/components/EventChatBot';

// Re-export the main component with explicit fullPage prop
const CalendarWithChat: React.FC = () => {
  return <EventChatBot fullPage={true} />;
};

export default CalendarWithChat;

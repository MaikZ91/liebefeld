
import React, { useState, useEffect, useRef } from 'react';
import { useChatMessages } from './useChatMessages';
import { useMessageSending } from './useMessageSending';
import { Message, TypingUser, EventShare } from '@/types/chatTypes';
import { format } from 'date-fns';
import MessageList from './MessageList';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import { useEventContext } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, Share } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatGroupProps {
  groupId: string;
  groupName?: string;
  onOpenUserDirectory?: () => void;
  compact?: boolean;
}

const ChatGroup: React.FC<ChatGroupProps> = ({ 
  groupId, 
  groupName = 'Chat',
  onOpenUserDirectory,
  compact = false
}) => {
  const username = localStorage.getItem('community_chat_username') || 'Gast';
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventShare | null>(null);
  const { events } = useEventContext();

  const {
    messages,
    loading,
    error,
    typingUsers,
    chatBottomRef,
    chatContainerRef,
  } = useChatMessages(groupId, username);

  // Manual optimistic updates for sent messages
  const addOptimisticMessage = (message: Message) => {
    const existingMessage = messages.find(m => m.id === message.id);
    if (!existingMessage) {
      const newMessages = [...messages, message];
      // We don't call setMessages directly here to avoid race conditions
      // This will be handled by the realtime subscription
    }
  };

  const {
    newMessage,
    isSending,
    fileInputRef,
    handleSubmit,
    handleInputChange,
    handleKeyDown,
    setNewMessage,
  } = useMessageSending(groupId, username, addOptimisticMessage);

  // Format time for display
  const formatTime = (isoDateString: string) => {
    try {
      const date = new Date(isoDateString);
      return format(date, 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  // Handle sending a message with an event
  const handleSendMessageWithEvent = async () => {
    if (selectedEvent) {
      await handleSubmit({ preventDefault: () => {} }, selectedEvent);
      setSelectedEvent(null);
      setIsEventSelectOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-[#efeae2] dark:bg-[#111b21]" style={{
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23d1d8dd' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      backgroundRepeat: "repeat",
      backgroundSize: "auto"
    }} ref={chatContainerRef}>
      <ChatHeader 
        title={groupName} 
        description={`${messages.length} messages`}
        isGroup={true}
        onUserListClick={onOpenUserDirectory}
        avatar=""
      />
      
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        username={username}
        typingUsers={typingUsers}
        formatTime={formatTime}
        isGroup={true}
        groupType="ausgehen"
        chatBottomRef={chatBottomRef}
      />
      
      <MessageInput
        username={username}
        groupId={groupId}
        handleSendMessage={handleSubmit}
        isEventSelectOpen={isEventSelectOpen}
        setIsEventSelectOpen={setIsEventSelectOpen}
        eventSelectContent={
          <div>
            <Card className="border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Events teilen</CardTitle>
                <CardDescription>Wähle ein Event zum Teilen aus</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px] p-4">
                  <div className="space-y-2">
                    {events.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Keine Events verfügbar
                      </div>
                    ) : (
                      events.map(event => (
                        <Button
                          key={event.id}
                          variant="outline" 
                          className={`w-full justify-start text-left ${
                            selectedEvent?.title === event.title ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''
                          }`}
                          onClick={() => setSelectedEvent({
                            title: event.title,
                            date: format(new Date(event.start_time), 'dd.MM.yyyy'),
                            time: format(new Date(event.start_time), 'HH:mm'),
                            location: event.location || 'Unbekannt',
                            category: event.category || 'Allgemein'
                          })}
                        >
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(event.start_time), 'dd.MM.yyyy, HH:mm')}
                            </div>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEventSelectOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleSendMessageWithEvent} 
                  disabled={!selectedEvent || isSending}
                  className="bg-[#25D366] hover:bg-[#1fb855]"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Share className="h-4 w-4 mr-2" />
                  )}
                  Teilen
                </Button>
              </CardFooter>
            </Card>
          </div>
        }
        isSending={isSending}
        value={newMessage}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default ChatGroup;

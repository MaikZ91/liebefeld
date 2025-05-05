
import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMessageSending } from '@/hooks/chat/useMessageSending';
import { EventShare } from '@/types/chatTypes';

interface ChatGroupProps {
  groupId: string;
  groupName: string;
  compact?: boolean;
  onOpenUserDirectory?: () => void;
}

const ChatGroup: React.FC<ChatGroupProps> = ({
  groupId,
  groupName,
  compact = false,
  onOpenUserDirectory
}) => {
  const isMobile = useIsMobile();
  const username = localStorage.getItem('liebefeld-username') || 'Gast';
  const [isEventSelectOpen, setIsEventSelectOpen] = useState(false);
  
  const {
    messages,
    loading,
    error,
    typingUsers,
    chatBottomRef,
    chatContainerRef,
    scrollToBottom,
    isUserScrolling,
    isAtBottom,
    isReconnecting,
    handleReconnect
  } = useChatMessages(groupId, username);

  // Determine the group type for styling
  const groupTypeMap: {[key: string]: 'ausgehen' | 'sport' | 'kreativität'} = {
    'Ausgehen': 'ausgehen',
    'Sport': 'sport',
    'Kreativität': 'kreativität',
    'Allgemein': 'ausgehen'
  };
  
  const groupType = groupTypeMap[groupName] || 'ausgehen';

  // Set up message sending functionality
  const {
    newMessage,
    isSending,
    handleSubmit,
    handleInputChange,
    handleKeyDown,
    setNewMessage
  } = useMessageSending(groupId, username, (message) => {
    // This is the addOptimisticMessage function
    const messages = document.querySelectorAll('.chat-message');
    if (messages.length > 0) {
      messages[messages.length - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Format timestamps
  const formatTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'gerade eben';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `vor ${minutes} Min.`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `vor ${hours} Std.`;
    }
    
    // Format as date
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden" ref={chatContainerRef}>
      <ChatHeader 
        groupName={groupName}
        isReconnecting={isReconnecting}
        handleReconnect={handleReconnect}
        onOpenUserDirectory={onOpenUserDirectory}
        isGroup={true}
      />

      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        username={username}
        typingUsers={typingUsers}
        formatTime={formatTime}
        isGroup={true}
        groupType={groupType}
        chatBottomRef={chatBottomRef}
        isUserScrolling={isUserScrolling}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <MessageInput
        username={username}
        groupId={groupId}
        handleSendMessage={handleSubmit}
        isEventSelectOpen={isEventSelectOpen}
        setIsEventSelectOpen={setIsEventSelectOpen}
        eventSelectContent={<div className="p-2">Keine Events verfügbar</div>}
        isSending={isSending}
        value={newMessage}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Schreibe eine Nachricht..."
        mode="community"
      />
    </div>
  );
};

export default ChatGroup;


import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useMessageSending } from './useMessageSending';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { formatRelativeTime } from '@/utils/chatUIUtils';
import { useTypingIndicator } from '@/hooks/chat/useTypingIndicator';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [message, setMessage] = useState('');
  const { sendMessage, sending } = useMessageSending();
  const { setTypingStatus } = useTypingIndicator();
  
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
    addOptimisticMessage
  } = useChatMessages(groupId, username);

  // Determine the group type for styling
  const groupTypeMap: {[key: string]: 'ausgehen' | 'sport' | 'kreativität'} = {
    'Ausgehen': 'ausgehen',
    'Sport': 'sport',
    'Kreativität': 'kreativität',
    'Allgemein': 'ausgehen'
  };
  
  const groupType = groupTypeMap[groupName] || 'ausgehen';

  useEffect(() => {
    // Reset message when changing groups
    setMessage('');
  }, [groupId]);

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;
    
    const timestamp = new Date().toISOString();
    const messageId = `temp-${Date.now()}`;
    
    // Create optimistic message
    const optimisticMessage = {
      id: messageId,
      content: message.trim(),
      created_at: timestamp,
      user_name: username,
      user_avatar: localStorage.getItem('liebefeld-avatar') || '',
      group_id: groupId,
      read_by: [username]
    };
    
    // Add optimistic message to list
    addOptimisticMessage(optimisticMessage);
    
    // Clear input
    setMessage('');
    
    // Send message to server
    await sendMessage({
      content: message.trim(),
      groupId: groupId,
      username: username,
      tempId: messageId
    });
    
    // Scroll to bottom
    scrollToBottom();
  };

  // Format timestamps
  const formatTime = (isoDateString: string) => {
    return formatRelativeTime(isoDateString);
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden" ref={chatContainerRef}>
      <ChatHeader 
        groupName={groupName} 
        onlineCount={5}
        onOpenUserDirectory={onOpenUserDirectory}
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
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSendMessage}
        sending={sending}
        groupId={groupId} 
        username={username}
        onTyping={(isTyping) => setTypingStatus(groupId, username, isTyping)}
        compact={compact}
      />
    </div>
  );
};

export default ChatGroup;


import React, { useState, useEffect } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useMessageSending } from '@/hooks/chat/useMessageSending';

interface ChatGroupProps {
  groupId: string;
  groupName: string;
  compact?: boolean;
}

const ChatGroup: React.FC<ChatGroupProps> = ({ groupId, groupName, compact = false }) => {
  const [username, setUsername] = useState<string>(() => localStorage.getItem(USERNAME_KEY) || 'Gast');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  
  // Fixed group detection logic - using the correct names
  const isSpotGroup = groupName.toLowerCase() === 'spot';
  const isSportGroup = groupName.toLowerCase() === 'sport';
  const isAusgehenGroup = groupName.toLowerCase() === 'ausgehen';

  const {
    messages,
    loading,
    error,
    typingUsers,
    isReconnecting,
    setMessages,
    setError,
    handleReconnect,
    chatBottomRef
  } = useChatMessages(groupId, username);

  const addOptimisticMessage = (message: any) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const {
    newMessage,
    isSending,
    fileInputRef,
    handleSubmit,
    handleInputChange,
    handleKeyDown,
    cleanup
  } = useMessageSending(groupId, username, addOptimisticMessage);

  // Aufräumen beim Unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
    }
  }, [username]);

  useEffect(() => {
    if (avatar) {
      localStorage.setItem(AVATAR_KEY, avatar);
    }
  }, [avatar]);

  // Enhanced debug logging
  useEffect(() => {
    console.log(`ChatGroup: Rendering for group ${groupId}, ${groupName}`);
    console.log(`isSpotGroup: ${isSpotGroup}, isSportGroup: ${isSportGroup}, isAusgehenGroup: ${isAusgehenGroup}`);
    console.log(`Total messages: ${messages.length}`);
    if (messages.length > 0) {
      console.log(`First message: ${JSON.stringify(messages[0])}`);
      console.log(`Last message: ${JSON.stringify(messages[messages.length - 1])}`);
    }
  }, [groupId, groupName, isSpotGroup, isSportGroup, isAusgehenGroup, messages.length]);

  const formatTime = (isoDateString: string): string => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 3600));
    const diffInDays = Math.floor(diff / (1000 * 3600 * 24));

    if (diffInMinutes < 1) {
      return 'jetzt';
    } else if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Minuten`;
    } else if (diffInHours < 24) {
      return `vor ${diffInHours} Stunden`;
    } else if (diffInDays === 1) {
      return 'gestern';
    } else if (diffInDays < 7) {
      return `vor ${diffInDays} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        groupName={groupName}
        isReconnecting={isReconnecting}
        handleReconnect={handleReconnect}
        compact={compact}
        isSpotGroup={isSpotGroup}
        isSportGroup={isSportGroup}
        isAusgehenGroup={isAusgehenGroup}
      />

      <MessageList 
        messages={messages}
        loading={loading}
        error={error}
        username={username}
        typingUsers={typingUsers}
        formatTime={formatTime}
        isSpotGroup={isSpotGroup}
        isSportGroup={isSportGroup}
        isAusgehenGroup={isAusgehenGroup}
        chatBottomRef={chatBottomRef}
      />

      <div className={`${isSpotGroup || isSportGroup || isAusgehenGroup ? 'bg-[#1A1F2C]' : 'bg-gray-900'} p-4 border-t ${isSpotGroup || isSportGroup || isAusgehenGroup ? 'border-gray-800' : 'border-gray-700'}`}>
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht senden..."
            className={`w-full rounded-md py-2 px-3 ${isSpotGroup || isSportGroup || isAusgehenGroup ? 'bg-[#222632] text-white border-gray-800' : 'bg-gray-800 text-white border-gray-700'} pr-12 text-base`}
            rows={1}
            style={{ resize: 'none', maxHeight: '100px' }}
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className={`absolute top-1/2 right-3 transform -translate-y-1/2 ${isSpotGroup || isSportGroup || isAusgehenGroup ? 'bg-[#9b87f5] hover:bg-[#7E69AB]' : 'bg-red-500 hover:bg-red-600'} text-white rounded-md p-2 ${isSending ? 'opacity-50' : ''}`}
            size="icon"
          >
            {isSending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={() => {}}
          />
        </form>
      </div>
    </div>
  );
};

export default ChatGroup;

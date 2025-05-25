
import React from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useMessageSending } from '@/hooks/chat/useMessageSending';
import { AVATAR_KEY, USERNAME_KEY } from '@/types/chatTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatMessage from '@/components/chat/ChatMessage';

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  onAddEvent?: () => void;
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent
}) => {
  const {
    messages: aiMessages,
    input,
    setInput,
    isTyping: aiTyping,
    globalQueries,
    showRecentQueries,
    setShowRecentQueries,
    messagesEndRef,
    inputRef,
    examplePrompts,
    isHeartActive,
    handleSendMessage: aiSendMessage,
    handleDateSelect,
    handleExamplePromptClick,
    handleKeyPress,
    handleHeartClick,
    toggleRecentQueries
  } = chatLogic;

  // Get username from localStorage
  const username = typeof window !== 'undefined' ? localStorage.getItem(USERNAME_KEY) || 'Anonymous' : 'Anonymous';
  
  // Community chat hooks
  const {
    messages: communityMessages,
    loading: communityLoading,
    error: communityError,
    typingUsers,
    chatBottomRef,
    chatContainerRef,
    addOptimisticMessage
  } = useChatMessages(communityGroupId, username);

  const {
    newMessage: communityInput,
    isSending: communitySending,
    handleSubmit: communitySendMessage,
    handleInputChange: communityInputChange,
    handleKeyDown: communityKeyDown,
    setNewMessage: setCommunityInput
  } = useMessageSending(communityGroupId, username, addOptimisticMessage);

  // Determine which queries to render
  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  // Format time helper for community messages
  const formatTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'gerade eben';
    if (diffInMinutes < 60) return `vor ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)}h`;
    return `vor ${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Unified send message handler
  const handleUnifiedSendMessage = async () => {
    if (activeChatModeValue === 'ai') {
      await aiSendMessage();
    } else {
      await communitySendMessage();
    }
  };

  // Unified input change handler
  const handleUnifiedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeChatModeValue === 'ai') {
      setInput(e.target.value);
    } else {
      // Convert input event to textarea event for community
      const textareaEvent = {
        ...e,
        target: {
          ...e.target,
          value: e.target.value
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      communityInputChange(textareaEvent);
    }
  };

  // Unified key press handler
  const handleUnifiedKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (activeChatModeValue === 'ai') {
      handleKeyPress(e);
    } else {
      // Convert to textarea key event for community
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        communitySendMessage();
      }
    }
  };

  // Get current input value
  const currentInputValue = activeChatModeValue === 'ai' ? input : communityInput;
  const currentIsTyping = activeChatModeValue === 'ai' ? aiTyping : communitySending;

  return (
    <div className="h-full flex flex-col">
      {/* ChatInput section for both modes */}
      <div className="p-3 border-b border-red-500/20 sticky top-0 z-10 bg-black px-[13px] py-[18px]">
        {activeChatModeValue === 'ai' && (
          <RecentQueries 
            showRecentQueries={showRecentQueries} 
            setShowRecentQueries={setShowRecentQueries} 
            queriesToRender={queriesToRender} 
            handleExamplePromptClick={handleExamplePromptClick} 
          />
        )}
        
        <ChatInput 
          input={currentInputValue} 
          setInput={activeChatModeValue === 'ai' ? setInput : setCommunityInput}
          handleSendMessage={handleUnifiedSendMessage} 
          isTyping={currentIsTyping} 
          handleKeyPress={handleUnifiedKeyPress} 
          isHeartActive={isHeartActive} 
          handleHeartClick={handleHeartClick} 
          globalQueries={globalQueries} 
          toggleRecentQueries={toggleRecentQueries} 
          inputRef={inputRef}
          onAddEvent={onAddEvent}
        />
      </div>
      
      {/* Main content area - switches between AI chat and Community chat */}
      <div className="flex-1 overflow-hidden">
        {activeChatModeValue === 'ai' ? (
          <div className="h-full p-3 overflow-y-auto">
            <div className="text-sm">
              <MessageList 
                messages={aiMessages} 
                isTyping={aiTyping} 
                handleDateSelect={handleDateSelect} 
                messagesEndRef={messagesEndRef} 
                examplePrompts={examplePrompts} 
                handleExamplePromptClick={handleExamplePromptClick} 
              />
            </div>
          </div>
        ) : (
          <div className="h-full">
            <div ref={chatContainerRef} className="flex-grow p-4 bg-black overflow-y-auto w-full max-w-full h-full flex flex-col">
              {communityError && (
                <div className="text-center text-red-500 text-lg font-semibold py-4">Error: {communityError}</div>
              )}

              <ScrollArea className="h-full w-full pr-2 flex-grow" type="hover">
                <div className="flex flex-col space-y-3 w-full max-w-full pb-4">
                  {communityMessages.length === 0 && !communityLoading && !communityError && (
                    <div className="text-center text-gray-400 py-4">Noch keine Nachrichten. Starte die Unterhaltung!</div>
                  )}
                  
                  {communityMessages.map((message, index) => {
                    const isConsecutive = index > 0 && communityMessages[index - 1].user_name === message.user_name;
                    const timeAgo = formatTime(message.created_at);
                    
                    return (
                      <div key={message.id} className="mb-4 w-full max-w-full overflow-hidden">
                        {!isConsecutive && (
                          <div className="flex items-center mb-2">
                            <Avatar className="h-8 w-8 mr-2 flex-shrink-0 border-red-500">
                              <AvatarImage src={message.user_avatar} alt={message.user_name} />
                              <AvatarFallback className="bg-red-500 text-white">{getInitials(message.user_name)}</AvatarFallback>
                            </Avatar>
                            <div className="text-lg font-medium text-white mr-2">{message.user_name}</div>
                            <span className="text-sm text-gray-400">{timeAgo}</span>
                          </div>
                        )}
                        <div className="w-full max-w-full overflow-hidden break-words">
                          <ChatMessage 
                            message={message.content} 
                            isConsecutive={isConsecutive}
                            isGroup={true}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  <TypingIndicator typingUsers={typingUsers} />
                  <div ref={chatBottomRef} />
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullPageChatBot;

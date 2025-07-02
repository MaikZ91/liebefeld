// File: src/components/event-chat/FullPageChatBot.tsx
import React, { useEffect } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useMessageSending } from '@/hooks/chat/useMessageSending';
import { AVATAR_KEY, USERNAME_KEY } from '@/types/chatTypes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils'; 
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageReactions from '@/components/chat/MessageReactions';
import { chatService } from '@/services/chatService';
import { useEventContext, cities } from '@/contexts/EventContext';
import { createGroupDisplayName } from '@/utils/groupIdUtils';

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  onAddEvent?: () => void;
  hideButtons?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideInput?: boolean;
  externalInput?: string;
  setExternalInput?: (value: string) => void;
  onExternalSendHandlerChange?: (handler: (() => void) | null) => void;
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent,
  activeCategory = 'Kreativität',
  onCategoryChange,
  hideInput = false,
  externalInput = '',
  setExternalInput,
  onExternalSendHandlerChange
}) => {
  const {
    messages: aiMessages,
    input: aiInput, // Renamed to aiInput
    setInput: setAiInput, // Renamed to setAiInput
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
    handleKeyPress: aiKeyPress, // Renamed to aiKeyPress
    handleInputChange: aiInputChange, // Renamed to aiInputChange
    handleHeartClick,
    toggleRecentQueries,
    showAnimatedPrompts 
  } = chatLogic;

  const { selectedCity } = useEventContext();

  const username =
    typeof window !== 'undefined'
      ? localStorage.getItem(USERNAME_KEY) || 'Anonymous'
      : 'Anonymous';

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
    handleInputChange: communityInputChangeFromHook, // Renamed to avoid conflict
    handleKeyDown: communityKeyDownFromHook, // Renamed to avoid conflict
    setNewMessage: setCommunityInput
  } = useMessageSending(communityGroupId, username, addOptimisticMessage);

  // Only update external input when community input changes, not the other way around
  useEffect(() => {
    if (activeChatModeValue === 'community' && setExternalInput && communityInput !== externalInput) {
      setExternalInput(communityInput);
    }
  }, [communityInput, activeChatModeValue, setExternalInput]);

  // Only update community input from external when it's different and not empty
  useEffect(() => {
    if (activeChatModeValue === 'community' && externalInput !== communityInput && externalInput !== '') {
      setCommunityInput(externalInput);
    }
  }, [externalInput, activeChatModeValue, setCommunityInput, communityInput]);

  // Provide external send handler
  useEffect(() => {
    if (activeChatModeValue === 'community' && onExternalSendHandlerChange) {
      onExternalSendHandlerChange(() => communitySendMessage);
    } else if (activeChatModeValue === 'ai' && onExternalSendHandlerChange) {
      onExternalSendHandlerChange(() => aiSendMessage);
    }
    
    return () => {
      if (onExternalSendHandlerChange) {
        onExternalSendHandlerChange(null);
      }
    };
  }, [activeChatModeValue, communitySendMessage, aiSendMessage, onExternalSendHandlerChange]);

  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  const formatTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diff < 1) return 'gerade eben';
    if (diff < 60) return `vor ${diff}m`;
    if (diff < 24 * 60) return `vor ${Math.floor(diff / 60)}h`;
    return `vor ${Math.floor(diff / 1440)}d`;
  };

  const getCommunityDisplayName = (category: string, cityAbbr: string): string => {
    return createGroupDisplayName(category, cityAbbr, cities);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.toggleReaction(messageId, emoji, username);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // Wrapper functions for community chat input handlers to match ChatInput's HTMLInputElement type
  const wrappedCommunityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    communityInputChangeFromHook(e);
  };

  const wrappedCommunityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    communityKeyDownFromHook(e);
  };

  // Unified functions to pass to ChatInput, based on activeChatModeValue
  const currentInput = activeChatModeValue === 'ai' ? aiInput : communityInput;
  const currentSetInput = activeChatModeValue === 'ai' ? setAiInput : setCommunityInput;
  const currentHandleSendMessage = activeChatModeValue === 'ai' ? aiSendMessage : communitySendMessage;
  const currentIsTyping = activeChatModeValue === 'ai' ? aiTyping : communitySending; // isTyping is AI processing, isSending is community sending
  const currentHandleKeyPress = activeChatModeValue === 'ai' ? aiKeyPress : wrappedCommunityKeyDown;
  const currentHandleInputChange = activeChatModeValue === 'ai' ? aiInputChange : wrappedCommunityInputChange;


  useEffect(() => {
    if (activeChatModeValue === 'ai' && messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [aiMessages, aiTyping, activeChatModeValue, messagesEndRef]);

  useEffect(() => {
    if (activeChatModeValue === 'community' && chatBottomRef?.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [communityMessages, communitySending, activeChatModeValue, chatBottomRef]);

  return (
    <div className="flex flex-col h-screen min-h-0">
      {/* Conditional sticky header - only show if input is not hidden */}
      {!hideInput && (
        <div className="border-b border-red-500/20 sticky top-0 z-10 bg-black px-[13px] py-2"> 
          {activeChatModeValue === 'ai' && (
            <RecentQueries
              showRecentQueries={showRecentQueries}
              setShowRecentQueries={setShowRecentQueries}
              queriesToRender={queriesToRender}
              handleExamplePromptClick={handleExamplePromptClick}
            />
          )}

          <ChatInput
            input={currentInput}
            setInput={currentSetInput} // Pass unified setInput
            handleSendMessage={currentHandleSendMessage} // Pass unified handleSendMessage
            isTyping={currentIsTyping} // Pass unified isTyping/isSending
            onKeyDown={currentHandleKeyPress} // Pass unified handleKeyPress
            onChange={currentHandleInputChange} // Pass unified handleInputChange
            isHeartActive={isHeartActive}
            handleHeartClick={handleHeartClick}
            globalQueries={globalQueries}
            toggleRecentQueries={toggleRecentQueries}
            inputRef={inputRef}
            onAddEvent={onAddEvent}
            showAnimatedPrompts={showAnimatedPrompts}
            activeChatModeValue={activeChatModeValue}
            activeCategory={activeCategory}
            onCategoryChange={onCategoryChange}
          />
        </div>
      )}

      {/* Main scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
        {activeChatModeValue === 'ai' ? (
          <div className={hideInput ? "pt-4 px-3" : "pt-32 px-3"}> 
            <MessageList
              messages={aiMessages}
              isTyping={aiTyping}
              handleDateSelect={handleDateSelect}
              messagesEndRef={messagesEndRef}
              examplePrompts={examplePrompts}
              handleExamplePromptClick={handleExamplePromptClick}
            />
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full min-h-0 flex flex-col">
            {communityError && (
              <div className="text-center text-red-500 text-lg font-semibold py-4">
                Error: {communityError}
              </div>
            )}

            <div
              ref={chatContainerRef}
              className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4"
            >
              <div className="space-y-2 py-4">
                {communityMessages.length === 0 && !communityLoading && !communityError && (
                  <div className="text-center text-gray-400 py-4">
                    Noch keine Nachrichten in {getCommunityDisplayName(activeCategory || 'Community', selectedCity)}. Starte die Unterhaltung!
                  </div>
                )}

                {communityMessages.map((message, index) => {
                  const isConsecutive =
                    index > 0 && communityMessages[index - 1].user_name === message.user_name;
                  const timeAgo = formatTime(message.created_at);

                  return (
                    <div key={message.id} className="w-full group">
                      {!isConsecutive && (
                        <div className="flex items-center mb-1">
                          <Avatar className="h-8 w-8 mr-2 flex-shrink-0 border-red-500">
                            <AvatarImage src={message.user_avatar} alt={message.user_name} />
                            <AvatarFallback className="bg-red-500 text-white">
                              {getInitials(message.user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-lg font-medium text-white mr-2">
                            {message.user_name}
                          </div>
                          <span className="text-sm text-gray-400">{timeAgo}</span>
                        </div>
                      )}
                      <div className="break-words">
                        <ChatMessage
                          message={message.text}
                          isConsecutive={isConsecutive}
                          isGroup
                          messageId={message.id}
                          reactions={message.reactions || []}
                          onReact={(emoji) => handleReaction(message.id, emoji)}
                          currentUsername={username}
                        />
                      </div>
                    </div>
                  );
                })}

                <TypingIndicator typingUsers={typingUsers} />
                <div ref={chatBottomRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullPageChatBot;
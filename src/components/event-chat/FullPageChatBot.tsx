// src/components/event-chat/FullPageChatBot.tsx
import React, { useEffect } from 'react';
import MessageList from './MessageList';
// import ChatInput from './ChatInput'; // Removed this import
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
  // hideButtons?: boolean; // This prop is not used here anymore
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onChatInputPropsChange?: (props: any) => void; // Added this prop
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent,
  activeCategory = 'Kreativität',
  onCategoryChange,
  onChatInputPropsChange // Destructure the new prop
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
    handleKeyPress: aiHandleKeyPress, // Renamed for clarity
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
    handleInputChange: communityInputChange,
    handleKeyDown: communityHandleKeyDown, // Renamed for clarity
    setNewMessage: setCommunityInput
  } = useMessageSending(communityGroupId, username, addOptimisticMessage);

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

  // --- Unified functions to pass to the external ChatInput ---
  const unifiedInput = activeChatModeValue === 'ai' ? input : communityInput;
  const unifiedSetInput = (value: string) => { activeChatModeValue === 'ai' ? setInput(value) : setCommunityInput(value); };
  const unifiedHandleSendMessage = async (eventData?: any) => {
    activeChatModeValue === 'ai' ? await aiSendMessage(eventData) : await communitySendMessage(eventData);
  };
  const unifiedIsSending = activeChatModeValue === 'ai' ? aiTyping : communitySending;
  const unifiedHandleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    activeChatModeValue === 'ai' ? aiHandleKeyPress(e) : communityHandleKeyDown(e);
  };
  const unifiedHandleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    activeChatModeValue === 'ai' ? chatLogic.handleInputChange(e) : communityInputChange(e);
  };

  // Provide chat input props to parent component (Layout)
  useEffect(() => {
    if (onChatInputPropsChange) {
      onChatInputPropsChange({
        input: unifiedInput,
        setInput: unifiedSetInput,
        handleSendMessage: unifiedHandleSendMessage,
        isTyping: unifiedIsSending,
        handleKeyPress: unifiedHandleKeyPress,
        handleInputChange: unifiedHandleInputChange, // Make sure to pass this as well
        isHeartActive: isHeartActive,
        handleHeartClick: handleHeartClick,
        globalQueries: globalQueries,
        toggleRecentQueries: toggleRecentQueries,
        inputRef: inputRef,
        onAddEvent: onAddEvent,
        showAnimatedPrompts: showAnimatedPrompts,
        activeCategory: activeCategory,
        onCategoryChange: onCategoryChange,
      });
    }
  }, [
    onChatInputPropsChange,
    unifiedInput,
    unifiedIsSending,
    isHeartActive,
    globalQueries,
    showAnimatedPrompts,
    activeCategory,
    onAddEvent, // Include onAddEvent in dependency array
    unifiedSetInput,
    unifiedHandleSendMessage,
    unifiedHandleKeyPress,
    unifiedHandleInputChange,
    handleHeartClick,
    toggleRecentQueries,
    inputRef,
    onCategoryChange
  ]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Removed ChatInput from here as it's now rendered in Layout.tsx */}
      {/* Keep RecentQueries if still relevant, adjusting its positioning if needed */}
      {activeChatModeValue === 'ai' && (
        <RecentQueries
          showRecentQueries={showRecentQueries}
          setShowRecentQueries={setShowRecentQueries}
          queriesToRender={queriesToRender}
          handleExamplePromptClick={handleExamplePromptClick}
        />
      )}

      {/* Main scroll container. Adjusted pt value as ChatInput is no longer here */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pt-4">
        {activeChatModeValue === 'ai' ? (
          <div className="px-3">
            <MessageList
              messages={aiMessages}
              isTyping={unifiedIsSending} // Use unifiedIsSending here
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
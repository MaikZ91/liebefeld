// src/components/event-chat/FullPageChatBot.tsx
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

/**
 * Hinweis: Für die unsichtbaren Scrollleisten wird das Tailwind-Plugin
 * `tailwind-scrollbar-hide` (oder gleichwertig) erwartet. 
 * Damit genügt die Utility-Klasse `scrollbar-none`.
 */

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  onAddEvent?: () => void;
  hideButtons?: boolean;
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
    toggleRecentQueries,
    showAnimatedPrompts 
  } = chatLogic;

  /* ------------------------------------------------------------------ */
  /* community chat hooks                                               */
  /* ------------------------------------------------------------------ */
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
    handleKeyDown: communityKeyDown,
    setNewMessage: setCommunityInput
  } = useMessageSending(communityGroupId, username, addOptimisticMessage);

  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  /* ------------------------------------------------------------------ */
  /* helpers                                                            */
  /* ------------------------------------------------------------------ */
  const formatTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diff < 1) return 'gerade eben';
    if (diff < 60) return `vor ${diff}m`;
    if (diff < 24 * 60) return `vor ${Math.floor(diff / 60)}h`;
    return `vor ${Math.floor(diff / 1440)}d`;
  };

  // Handle reaction toggle
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.toggleReaction(messageId, emoji, username);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleUnifiedSendMessage = async () => {
    activeChatModeValue === 'ai' ? await aiSendMessage() : await communitySendMessage();
  };

  const handleUnifiedInputChange = (value: string) => {
    activeChatModeValue === 'ai' ? setInput(value) : setCommunityInput(value);
  };

  const handleUnifiedKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (activeChatModeValue === 'ai') {
      handleKeyPress(e);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      communitySendMessage();
    }
  };

  const currentInputValue = activeChatModeValue === 'ai' ? input : communityInput;
  const currentIsTyping = activeChatModeValue === 'ai' ? aiTyping : communitySending;

  /* ------------------------------------------------------------------ */
  /* Auto-jump to bottom                                                */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col h-screen min-h-0">
      {/* Sticky Header */}
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
          input={currentInputValue}
          setInput={handleUnifiedInputChange}
          handleSendMessage={handleUnifiedSendMessage}
          isTyping={currentIsTyping}
          handleKeyPress={handleUnifiedKeyPress}
          isHeartActive={isHeartActive}
          handleHeartClick={handleHeartClick}
          globalQueries={globalQueries}
          toggleRecentQueries={toggleRecentQueries}
          inputRef={inputRef}
          onAddEvent={onAddEvent}
          showAnimatedPrompts={showAnimatedPrompts}
          activeChatModeValue={activeChatModeValue} // HIER WIRD activeChatModeValue WEITERGEGEBEN
        />
      </div>

      {/* Main scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
        {activeChatModeValue === 'ai' ? (
          <div className="pt-32 px-3"> 
            <MessageList
              messages={aiMessages}
              isTyping={aiTyping}
              handleDateSelect={handleDateSelect}
              messagesEndRef={messagesEndRef}
              examplePrompts={examplePrompts} // examplePrompts weiterhin hier übergeben
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
                    Noch keine Nachrichten. Starte die Unterhaltung!
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
                          message={message.content}
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
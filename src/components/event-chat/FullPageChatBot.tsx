// src/components/event-chat/FullPageChatBot.tsx
import React, { useEffect, useState, useMemo } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useMessageSending } from '@/hooks/chat/useMessageSending';
import { AVATAR_KEY, USERNAME_KEY, EventShare } from '@/types/chatTypes'; // Import EventShare
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils'; 
import TypingIndicator from '@/components/chat/TypingIndicator';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageReactions from '@/components/chat/MessageReactions';
import { chatService } from '@/services/chatService';
import { useEventContext, cities } from '@/contexts/EventContext';
import { createGroupDisplayName } from '@/utils/groupIdUtils';
import { Button } from '@/components/ui/button';

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
  onAddEvent?: () => void;
  hideButtons?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onJoinEventChat?: (eventId: string, eventTitle: string) => void;
  hideInput?: boolean;
  externalInput?: string;
  setExternalInput?: (value: string) => void;
  onExternalSendHandlerChange?: (handler: ((input?: string | any) => Promise<void>) | null) => void; // Updated handler type
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId,
  onAddEvent,
  activeCategory = 'Ausgehen',
  onCategoryChange,
  onJoinEventChat,
  hideInput = false,
  externalInput = '',
  setExternalInput,
  onExternalSendHandlerChange
}) => {
  const {
    messages: aiMessages,
    input: aiInput,
    setInput: setAiInput,
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
    handleKeyPress: aiKeyPress,
    handleInputChange: aiInputChange,
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
    addOptimisticMessage,
    setMessages
  } = useChatMessages(communityGroupId, username);

  const {
    newMessage: communityInput,
    isSending: communitySending,
    handleSubmit: communitySendMessage,
    handleInputChange: communityInputChangeFromHook,
    handleKeyDown: communityKeyDownFromHook,
    setNewMessage: setCommunityInput
  } = useMessageSending(communityGroupId, username, addOptimisticMessage, activeCategory);

  // Filter state for community chat
  const [messageFilter, setMessageFilter] = useState<string[]>(['alle']);

  useEffect(() => {
    if (activeChatModeValue === 'community' && setExternalInput && externalInput !== communityInput) {
      setCommunityInput(externalInput);
    }
  }, [externalInput, activeChatModeValue, setCommunityInput]);

  useEffect(() => {
    if (onExternalSendHandlerChange) {
      if (activeChatModeValue === 'community') {
        onExternalSendHandlerChange(communitySendMessage);
      } else if (activeChatModeValue === 'ai') {
        onExternalSendHandlerChange(aiSendMessage);
      } else {
        onExternalSendHandlerChange(null);
      }
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
      console.log('FullPageChatBot: Toggling reaction', { messageId, emoji, username });
      
      // Optimistic update - update UI immediately
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === messageId) {
            const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
            const existingReactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);
            
            if (existingReactionIndex >= 0) {
              // Reaction exists, toggle user
              const reaction = reactions[existingReactionIndex];
              const users = reaction.users || [];
              const userIndex = users.indexOf(username);
              
              if (userIndex >= 0) {
                // Remove user
                users.splice(userIndex, 1);
                if (users.length === 0) {
                  reactions.splice(existingReactionIndex, 1);
                }
              } else {
                // Add user
                users.push(username);
              }
            } else {
              // Add new reaction
              reactions.push({ emoji, users: [username] });
            }
            
            console.log('FullPageChatBot: Optimistic update applied', { messageId, reactions });
            return { ...msg, reactions };
          }
          return msg;
        });
      });
      
      // Then update the database
      await chatService.toggleReaction(messageId, emoji, username);
      console.log('FullPageChatBot: Reaction toggled successfully');
    } catch (error) {
      console.error('FullPageChatBot: Error toggling reaction:', error);
      // TODO: Revert optimistic update on error
    }
  };

  const wrappedCommunityInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    communityInputChangeFromHook(e);
  };

  const wrappedCommunityKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    communityKeyDownFromHook(e);
  };

  const currentInput = activeChatModeValue === 'ai' ? aiInput : communityInput;
  const currentSetInput = activeChatModeValue === 'ai' ? setAiInput : setCommunityInput;
  const currentHandleSendMessage = activeChatModeValue === 'ai' ? aiSendMessage : communitySendMessage;
  const currentIsTyping = activeChatModeValue === 'ai' ? aiTyping : communitySending;
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

  // Filter messages based on selected categories
  const filteredCommunityMessages = useMemo(() => {
    if (messageFilter.includes('alle')) {
      return communityMessages;
    }
    
    return communityMessages.filter(message => {
      // Check if message contains any of the selected hashtags
      const messageText = message.text.toLowerCase();
      return messageFilter.some(category => 
        messageText.includes(`#${category.toLowerCase()}`)
      );
    });
  }, [communityMessages, messageFilter]);

  return (
    <div className="flex flex-col h-screen min-h-0">
      {!hideInput && (
        <div className="sticky top-0 z-10 bg-black">
          <div className="border-b border-red-500/20 px-[13px] py-2">
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
              setInput={currentSetInput}
              handleSendMessage={currentHandleSendMessage}
              isTyping={currentIsTyping}
              onKeyDown={currentHandleKeyPress}
              onChange={currentHandleInputChange}
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
              onJoinEventChat={onJoinEventChat}
            />
          </div>
          
          {/* Filter UI für Community Chat - direkt unter ChatInput */}
          {activeChatModeValue === 'community' && (
            <div className="border-b border-gray-800 bg-black">
              <div className="px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {['alle', 'ausgehen', 'kreativität', 'sport'].map((category) => (
                    <Button
                      key={category}
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 text-xs rounded-full ${
                        messageFilter.includes(category)
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        if (category === 'alle') {
                          setMessageFilter(['alle']);
                        } else {
                          setMessageFilter(prev => {
                            const newFilter = prev.filter(f => f !== 'alle');
                            if (newFilter.includes(category)) {
                              const result = newFilter.filter(f => f !== category);
                              return result.length === 0 ? ['alle'] : result;
                            } else {
                              return [...newFilter, category];
                            }
                          });
                        }
                      }}
                    >
                      #{category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
              <div className="space-y-2 py-4 pb-24">
                {filteredCommunityMessages.length === 0 && !communityLoading && !communityError && (
                  <div className="text-center text-gray-400 py-4">
                    {messageFilter.includes('alle') 
                      ? 'Noch keine Nachrichten im Community Chat. Starte die Unterhaltung!'
                      : `Keine Nachrichten in den gewählten Kategorien gefunden.`
                    }
                  </div>
                )}

                {filteredCommunityMessages.map((message, index) => {
                  const isConsecutive =
                    index > 0 && filteredCommunityMessages[index - 1].user_name === message.user_name;
                  const timeAgo = formatTime(message.created_at);

                  return (
                    <div key={message.id} className="mb-1 w-full group">
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
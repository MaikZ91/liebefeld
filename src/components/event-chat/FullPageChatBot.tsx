
import React from 'react';
import GroupChat from '@/components/GroupChat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';

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
    messages,
    input,
    setInput,
    isTyping,
    globalQueries,
    showRecentQueries,
    setShowRecentQueries,
    messagesEndRef,
    inputRef,
    examplePrompts,
    isHeartActive,
    handleSendMessage,
    handleDateSelect,
    handleExamplePromptClick,
    handleKeyPress,
    handleHeartClick,
    toggleRecentQueries
  } = chatLogic;

  // Determine which queries to render
  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  return (
    <div className="h-full flex flex-col">
      {/* ChatInput section only for AI mode */}
      {activeChatModeValue === 'ai' && (
        <div className="p-3 border-b border-red-500/20 sticky top-0 z-10 bg-black px-[13px] py-[18px]">
          <RecentQueries 
            showRecentQueries={showRecentQueries} 
            setShowRecentQueries={setShowRecentQueries} 
            queriesToRender={queriesToRender} 
            handleExamplePromptClick={handleExamplePromptClick} 
          />
          
          <ChatInput 
            input={input} 
            setInput={setInput} 
            handleSendMessage={handleSendMessage} 
            isTyping={isTyping} 
            handleKeyPress={handleKeyPress} 
            isHeartActive={isHeartActive} 
            handleHeartClick={handleHeartClick} 
            globalQueries={globalQueries} 
            toggleRecentQueries={toggleRecentQueries} 
            inputRef={inputRef}
            onAddEvent={onAddEvent}
          />
        </div>
      )}
      
      {/* Main content area - switches between AI chat and Community chat */}
      <div className="flex-1 overflow-hidden">
        {activeChatModeValue === 'ai' ? (
          <div className="h-full p-3 overflow-y-auto">
            <div className="text-sm">
              <MessageList 
                messages={messages} 
                isTyping={isTyping} 
                handleDateSelect={handleDateSelect} 
                messagesEndRef={messagesEndRef} 
                examplePrompts={examplePrompts} 
                handleExamplePromptClick={handleExamplePromptClick} 
              />
            </div>
          </div>
        ) : (
          <div className="h-full">
            <GroupChat 
              compact={false} 
              groupId={communityGroupId} 
              groupName="Community" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FullPageChatBot;

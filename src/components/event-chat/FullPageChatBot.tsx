
import React from 'react';
import GroupChat from '@/components/GroupChat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';

interface FullPageChatBotProps {
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
}

const FullPageChatBot: React.FC<FullPageChatBotProps> = ({
  chatLogic,
  activeChatModeValue,
  communityGroupId
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
      {/* ChatInput section moved above the messages area with fixed position styling */}
      <div className="p-3 border-b border-red-500/20 sticky top-0 z-10 bg-black px-[13px] py-[18px]">
        <div className="flex items-center relative">
          {/* Heart button for toggling personalized mode */}
          {activeChatModeValue === 'ai' && (
            <>
              <div className="relative w-full">
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
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-240px)]">
        {activeChatModeValue === 'ai' ? (
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
        ) : (
          <GroupChat compact={false} groupId={communityGroupId} groupName="Allgemein" />
        )}
      </div>
    </div>
  );
};

export default FullPageChatBot;

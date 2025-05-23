
import React from 'react';
import GroupChat from '@/components/GroupChat';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import MessageInput from '@/components/chat/MessageInput';

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

  // Handle toggle between AI and Community chat
  const handleToggleChatMode = () => {
    // This will be handled by the parent component
  };

  // Determine which queries to render
  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  return (
    <div className="h-full flex flex-col">
      {/* Chat content area */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-180px)]">
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

      {/* Input section at the bottom */}
      <div className="p-3 border-t border-red-500/20 sticky bottom-0 z-10 bg-black">
        {activeChatModeValue === 'ai' && (
          <RecentQueries
            showRecentQueries={showRecentQueries}
            setShowRecentQueries={setShowRecentQueries}
            queriesToRender={queriesToRender}
            handleExamplePromptClick={handleExamplePromptClick}
          />
        )}
        
        {activeChatModeValue === 'ai' ? (
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
            activeChatMode={activeChatModeValue}
            onToggleChatMode={() => {}}
          />
        ) : (
          <div className="flex items-center relative">
            <div className="absolute left-2 flex items-center gap-1 z-10">
              <button 
                onClick={() => {}} 
                className="h-6 w-6 text-red-500 flex items-center justify-center" 
                title="Zurück zum AI Chat"
              >
                <MessageInput
                  username="User"
                  groupId={communityGroupId}
                  handleSendMessage={async () => {}}
                  isEventSelectOpen={false}
                  setIsEventSelectOpen={() => {}}
                  eventSelectContent={<div></div>}
                  isSending={false}
                  placeholder="Schreibe in der Community..."
                  mode="community"
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullPageChatBot;

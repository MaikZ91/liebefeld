
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import GroupChat from '@/components/GroupChat';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import RecentQueries from './RecentQueries';
import { EventChatBotProps } from './types';

interface FloatingChatBotProps extends EventChatBotProps {
  isChatOpen: boolean;
  handleToggleChat: () => void;
  chatLogic: any;
  activeChatModeValue: 'ai' | 'community';
  communityGroupId: string;
}

const FloatingChatBot: React.FC<FloatingChatBotProps> = ({
  isChatOpen,
  handleToggleChat,
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
    toggleRecentQueries,
    clearChatHistory,
    exportChatHistory
  } = chatLogic;

  // Determine which queries to render
  const queriesToRender = globalQueries.length > 0 ? globalQueries : [];

  if (!isChatOpen) {
    return (
      <Button
        onClick={handleToggleChat}
        className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg bg-red-500 hover:bg-red-600 text-white"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="bg-black dark:bg-zinc-900/95 rounded-lg shadow-xl mb-3 w-[320px] sm:w-[350px] max-h-[500px] flex flex-col border border-red-500/20 transition-all duration-300 animate-slide-up backdrop-blur-lg">
      <ChatHeader
        activeChatModeValue={activeChatModeValue}
        handleToggleChat={handleToggleChat}
        exportChatHistory={exportChatHistory}
        clearChatHistory={clearChatHistory}
      />
      
      <ScrollArea className="flex-1 p-3 overflow-y-auto max-h-[350px]">
        {activeChatModeValue === 'ai' ? (
          <div className="space-y-3 pb-2 text-sm">
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
          <GroupChat compact={true} groupId={communityGroupId} groupName="Allgemein" />
        )}
      </ScrollArea>
      
      <div className="p-3 border-t border-red-500/20 relative">
        <div className="relative w-full">
          <RecentQueries
            showRecentQueries={showRecentQueries}
            setShowRecentQueries={setShowRecentQueries}
            queriesToRender={queriesToRender}
            handleExamplePromptClick={handleExamplePromptClick}
          />
        </div>
        
        {activeChatModeValue === 'ai' && (
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
        )}
      </div>
    </div>
  );
};

export default FloatingChatBot;

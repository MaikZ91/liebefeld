
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, MessageSquare, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/chatUIUtils';
import { AVATAR_KEY } from '@/types/chatTypes';
import EventCalendar from '../EventCalendar';
import GroupChat from '../GroupChat';
import { GroupSelector } from './GroupSelector';

interface DesktopLayoutProps {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  handleClickChat: () => void;
  activeGroup: string;
  activeGroupName: string;
  username: string;
  setIsUsernameModalOpen: (isOpen: boolean) => void;
  newMessages: number;
  groups: any[]; // Using any here but you can replace with your specific type
  handleGroupSelect: (groupId: string) => void;
  defaultView: "calendar" | "list";
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  showChat,
  setShowChat,
  handleClickChat,
  activeGroup,
  activeGroupName,
  username,
  setIsUsernameModalOpen,
  newMessages,
  groups,
  handleGroupSelect,
  defaultView
}) => {
  return (
    <div className="hidden md:flex gap-4 h-[calc(100vh-220px)] min-h-[600px]">
      <div className={cn(
        "transition-all duration-300 overflow-hidden",
        showChat ? "w-1/3" : "w-full"
      )}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-white bg-red-500 rounded-full px-4 py-1">Kalender</h2>
          {!showChat && (
            <Button 
              onClick={handleClickChat} 
              className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 shadow-lg relative"
            >
              <span>Community Chat</span>
              {newMessages > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {newMessages}
                </Badge>
              )}
            </Button>
          )}
        </div>
        <div className="h-full flex-grow overflow-hidden border border-gray-700 rounded-lg">
          <EventCalendar defaultView={defaultView} />
        </div>
      </div>
      
      {showChat ? (
        <div className="w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-white bg-red-500 rounded-full px-4 py-1">Community Chat</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowChat(false)}
              className="h-8 w-8 p-0 bg-gray-800 text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4">
            {username && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 bg-gray-800 border border-gray-700">
                    <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                    <AvatarFallback className="bg-red-500 text-white">{getInitials(username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-white">{username}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsUsernameModalOpen(true)}
                      className="p-0 h-auto text-xs text-gray-400 hover:text-white"
                    >
                      Ändern
                    </Button>
                  </div>
                </div>
                
                <GroupSelector 
                  activeGroup={activeGroup}
                  activeGroupName={activeGroupName}
                  groups={groups}
                  handleGroupSelect={handleGroupSelect}
                />
              </div>
            )}
            
            {activeGroup && (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="h-[calc(100vh-320px)] min-h-[400px]">
                  <GroupChat compact={false} groupId={activeGroup} groupName={activeGroupName} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Button 
          onClick={handleClickChat} 
          className="fixed right-4 bottom-20 bg-white text-black hover:bg-gray-200 rounded-full shadow-lg relative"
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
          {newMessages > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
              {newMessages}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
};

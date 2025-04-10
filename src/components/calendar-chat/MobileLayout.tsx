
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/chatUIUtils';
import { AVATAR_KEY } from '@/types/chatTypes';
import EventCalendar from '../EventCalendar';
import GroupChat from '../GroupChat';
import { GroupSelector } from './GroupSelector';

interface MobileLayoutProps {
  activeMobileView: 'calendar' | 'chat';
  handleClickCalendar: () => void;
  handleClickChat: () => void;
  newEvents: number;
  newMessages: number;
  username: string;
  setIsUsernameModalOpen: (isOpen: boolean) => void;
  activeGroup: string;
  activeGroupName: string;
  groups: any[]; // Using any here but you can replace with your specific type
  handleGroupSelect: (groupId: string) => void;
  defaultView: "calendar" | "list";
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  activeMobileView,
  handleClickCalendar,
  handleClickChat,
  newEvents,
  newMessages,
  username,
  setIsUsernameModalOpen,
  activeGroup,
  activeGroupName,
  groups,
  handleGroupSelect,
  defaultView
}) => {
  return (
    <div className="md:hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm w-full" role="group">
          <Button
            variant={activeMobileView === 'calendar' ? 'default' : 'outline'} 
            onClick={handleClickCalendar}
            className={cn(
              "rounded-l-md rounded-r-none flex-1 relative",
              activeMobileView === 'calendar' ? "bg-white text-black" : "bg-gray-800 text-white border-gray-700"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Kalender
            {newEvents > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                {newEvents}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeMobileView === 'chat' ? 'default' : 'outline'} 
            onClick={handleClickChat}
            className={cn(
              "rounded-r-md rounded-l-none flex-1 relative",
              activeMobileView === 'chat' ? "bg-white text-black" : "bg-gray-800 text-white border-gray-700"
            )}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Community
            {newMessages > 0 && activeMobileView !== 'chat' && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                {newMessages}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "flex-grow transition-all duration-300",
        activeMobileView === 'calendar' ? 'block' : 'hidden'
      )}>
        <EventCalendar defaultView={defaultView} />
      </div>
      
      <div className={cn(
        "flex-grow transition-all duration-300 overflow-hidden",
        activeMobileView === 'chat' ? 'block' : 'hidden'
      )}>
        {username ? (
          <>
            <div className="flex items-center justify-between mb-2 gap-2">
              <GroupSelector 
                activeGroup={activeGroup}
                activeGroupName={activeGroupName}
                groups={groups}
                handleGroupSelect={handleGroupSelect}
                mobile={true}
              />
              
              <Avatar 
                className="h-8 w-8 ml-2 bg-gray-800 border border-gray-700" 
                onClick={() => setIsUsernameModalOpen(true)}
              >
                <AvatarImage src={localStorage.getItem(AVATAR_KEY) || undefined} alt={username} />
                <AvatarFallback className="bg-red-500 text-white">{getInitials(username)}</AvatarFallback>
              </Avatar>
            </div>
            
            {activeGroup && (
              <div className="h-[calc(100vh-280px)] min-h-[400px] border border-gray-700 rounded-lg overflow-hidden">
                <GroupChat compact={false} groupId={activeGroup} groupName={activeGroupName} key={activeGroup} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <p className="mb-4 text-center">Bitte erstelle einen Benutzernamen, um am Chat teilzunehmen</p>
            <Button onClick={() => setIsUsernameModalOpen(true)} className="bg-red-500 hover:bg-red-600 text-white">
              Benutzernamen erstellen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

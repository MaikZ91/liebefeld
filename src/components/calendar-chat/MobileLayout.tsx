
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  // Update key generation to ensure remounting when any relevant prop changes
  const [chatKey, setChatKey] = useState(() => `mobile-chat-${Date.now()}-${activeGroup}`);
  
  // When active view or group changes, update the key to force remount
  useEffect(() => {
    if (activeMobileView === 'chat') {
      // Ensure a new key is always generated when relevant props change
      setChatKey(`mobile-chat-${Date.now()}-${activeGroup}-${activeGroupName}`);
      console.log(`Remounting GroupChat with new key: ${chatKey} for group: ${activeGroupName}`);
    }
  }, [activeMobileView, activeGroup, activeGroupName]);
  
  return (
    <div className="md:hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <div className={cn(
        "flex-grow transition-all duration-300",
        activeMobileView === 'calendar' ? 'block' : 'hidden'
      )}>
        <EventCalendar defaultView={defaultView} />
      </div>
      
      <div className={cn(
        "flex-grow transition-all duration-300 overflow-hidden flex flex-col",
        activeMobileView === 'chat' ? 'block' : 'hidden'
      )}>
        {username ? (
          <>
            <div className="flex items-center justify-between mb-2 gap-2">
              <GroupSelector 
                activeGroup={activeGroup}
                activeGroupName={activeGroupName}
                groups={groups}
                handleGroupSelect={(newGroupId) => {
                  console.log(`Group selection changed to ${newGroupId}`);
                  handleGroupSelect(newGroupId);
                  // Force remount when group changes
                  setChatKey(`mobile-chat-${Date.now()}-${newGroupId}`);
                }}
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
              <div className="h-[calc(100vh-280px)] min-h-[400px] border border-gray-700 rounded-lg overflow-hidden flex-grow flex flex-col">
                <GroupChat 
                  compact={false} 
                  groupId={activeGroup} 
                  groupName={activeGroupName} 
                  key={chatKey} 
                />
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


import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const touchStartX = useRef(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const swipeHintTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Reset swipe animation after showing briefly
  useEffect(() => {
    return () => {
      if (swipeHintTimeout.current) {
        clearTimeout(swipeHintTimeout.current);
      }
    };
  }, []);
  
  // Add touch handlers for swipe functionality directly in the component
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX.current;
    
    console.log(`Swipe detected: ${diffX}px`);
    
    // If swipe distance is significant enough (more than 50px)
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe right -> go to calendar
        if (activeMobileView === 'chat') {
          console.log('Swiping right to calendar');
          setSwipeDirection('right');
          setShowSwipeHint(true);
          
          swipeHintTimeout.current = setTimeout(() => {
            setShowSwipeHint(false);
          }, 1000);
          
          handleClickCalendar();
        }
      } else {
        // Swipe left -> go to chat
        if (activeMobileView === 'calendar') {
          console.log('Swiping left to chat');
          setSwipeDirection('left');
          setShowSwipeHint(true);
          
          swipeHintTimeout.current = setTimeout(() => {
            setShowSwipeHint(false);
          }, 1000);
          
          handleClickChat();
        }
      }
    }
  };
  
  // When active view or group changes, update the key to force remount
  useEffect(() => {
    if (activeMobileView === 'chat') {
      // Ensure a new key is always generated when relevant props change
      setChatKey(`mobile-chat-${Date.now()}-${activeGroup}-${activeGroupName}`);
      console.log(`Remounting GroupChat with new key: ${chatKey} for group: ${activeGroupName}`);
    }
  }, [activeMobileView, activeGroup, activeGroupName]);
  
  return (
    <div 
      className="md:hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px] relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator overlay */}
      {showSwipeHint && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300">
          <div className="bg-gray-900 bg-opacity-90 rounded-full p-6 shadow-lg transform scale-110 animate-pulse">
            {swipeDirection === 'left' ? (
              <ChevronLeft className="h-16 w-16 text-white" />
            ) : (
              <ChevronRight className="h-16 w-16 text-white" />
            )}
          </div>
          <p className="absolute bottom-20 text-white font-bold text-xl">
            {swipeDirection === 'left' ? 'Zum Chat' : 'Zum Kalender'}
          </p>
        </div>
      )}

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
        <div className="text-center text-gray-500 text-xs mb-2">← Swipe nach links für Chat</div>
        <EventCalendar defaultView={defaultView} />
      </div>
      
      <div className={cn(
        "flex-grow transition-all duration-300 overflow-hidden",
        activeMobileView === 'chat' ? 'block' : 'hidden'
      )}>
        <div className="text-center text-gray-500 text-xs mb-2">Swipe nach rechts für Kalender →</div>
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
              <div className="h-[calc(100vh-280px)] min-h-[400px] border border-gray-700 rounded-lg overflow-hidden">
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

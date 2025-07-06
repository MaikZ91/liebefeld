// src/components/TribeFinder.tsx
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, MessageCircle, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EventChatBot from './EventChatBot';
import { useEventContext } from '@/contexts/EventContext';
import { getInitials } from '@/utils/chatUIUtils';

interface TribeFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TribeFinder: React.FC<TribeFinderProps> = ({ open, onOpenChange }) => {
  const [activeChatMode, setActiveChatMode] = useState<'ai' | 'community'>('ai');
  const [chatInputProps, setChatInputProps] = useState<any>(null);
  const { selectedCity } = useEventContext();
  
  // Mock user data for the demo
  const currentUser = {
    name: "Maik Zschach",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maik",
    status: "online"
  };

  const handleChatInputPropsChange = (props: any) => {
    setChatInputProps(props);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full h-[90vh] max-h-[800px] p-0 gap-0 bg-black border-red-500/30">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-red-500/20 bg-black/95">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-red-500/20 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <DialogTitle className="text-white font-bold text-lg tracking-wider">
              THE TRIBE
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/20 h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/20 h-8 w-8"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-b border-red-500/20 bg-black/95">
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <Avatar className="h-20 w-20 border-4 border-red-500">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback className="bg-red-500 text-white text-lg font-bold">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h3 className="text-white font-bold text-xl mb-1">{currentUser.name}</h3>
            <p className="text-gray-400 text-sm mb-3">Aktiv in {selectedCity}</p>
            
            <div className="text-center text-gray-300 text-sm bg-gray-800/50 rounded-lg p-3 w-full">
              <MessageCircle className="h-5 w-5 mx-auto mb-2 text-red-400" />
              <p className="font-medium">Finde deine Tribe!</p>
              <p className="text-xs text-gray-400 mt-1">
                Verbinde dich mit Gleichgesinnten in deiner Nähe
              </p>
            </div>
          </div>
        </div>

        {/* Chat Bot Integration */}
        <div className="flex-1 min-h-0 relative">
          <EventChatBot
            fullPage
            activeChatMode={activeChatMode}
            setActiveChatMode={setActiveChatMode}
            onChatInputPropsChange={handleChatInputPropsChange}
          />
        </div>

        {/* AI Suggestion Button */}
        <div className="p-4 border-t border-red-500/20 bg-black/95">
          <Button
            onClick={() => {
              if (chatInputProps?.handleSendMessage) {
                chatInputProps.handleSendMessage("Soll ich ein neues Treffen für dich erstellen?");
              }
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full py-3 font-medium flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Soll ich ein neues Treffen für dich erstellen?
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TribeFinder;
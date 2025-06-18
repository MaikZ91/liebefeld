
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
  newMessagesCount: number;
  newEventsCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  setActiveView,
  handleOpenUserDirectory,
  setIsEventListSheetOpen,
  newMessagesCount,
  newEventsCount
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-gray-700">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {/* Events Button */}
        <Button 
          variant={activeView === 'ai' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setActiveView?.('ai')} 
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 h-auto relative min-w-0",
            activeView === 'ai' ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">Events</span>
          {newEventsCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[10px] p-0">
              {newEventsCount}
            </Badge>
          )}
        </Button>

        {/* Community Button */}
        <Button 
          variant={activeView === 'community' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setActiveView?.('community')} 
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 h-auto relative min-w-0",
            activeView === 'community' ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">Community</span>
          {newMessagesCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[10px] p-0">
              {newMessagesCount}
            </Badge>
          )}
        </Button>

        {/* User Directory Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleOpenUserDirectory} 
          className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-gray-400 hover:text-white min-w-0"
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Nutzer</span>
        </Button>
        
        {/* Calendar Events Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEventListSheetOpen?.(true)} 
          className="flex flex-col items-center gap-1 px-3 py-2 h-auto text-gray-400 hover:text-white min-w-0"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">Kalender</span>
        </Button>
      </div>
    </div>
  );
};

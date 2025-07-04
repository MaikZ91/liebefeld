// src/components/layouts/BottomNavigation.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Users, Map } from 'lucide-react'; // Removed User icon as it might not be used
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavigationProps {
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  // handleOpenUserDirectory and setIsEventListSheetOpen are removed as they are no longer used for navigation directly from here
  newMessagesCount: number;
  newEventsCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  setActiveView,
  newMessagesCount,
  newEventsCount
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnHeatmap = location.pathname === '/heatmap';
  const isOnUsersPage = location.pathname === '/users';
  const isOnEventsPage = location.pathname === '/events';


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-gray-700 min-h-16">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {/* Community Chat Button (replaces the AI button) */}
        <Button 
          variant={activeView === 'community' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => {
            setActiveView?.('community');
            navigate('/chat?view=community');
          }} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto relative min-w-0",
            activeView === 'community' ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-[10px]">Chat</span>
          {newMessagesCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[8px] p-0">
              {newMessagesCount}
            </Badge>
          )}
        </Button>

        {/* Heatmap Button */}
        <Button 
          variant={isOnHeatmap ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate('/heatmap')} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto min-w-0",
            isOnHeatmap ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Map className="h-4 w-4" />
          <span className="text-[10px]">Karte</span>
        </Button>

        {/* User Directory Button */}
        <Button 
          variant={isOnUsersPage ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate('/users')} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto min-w-0",
            isOnUsersPage ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Users className="h-4 w-4" />
          <span className="text-[10px]">Nutzer</span>
        </Button>
        
        {/* Calendar Events Button */}
        <Button 
          variant={isOnEventsPage ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate('/events')} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto min-w-0",
            isOnEventsPage ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[10px]">Events</span>
          {newEventsCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[8px] p-0">
              {newEventsCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};